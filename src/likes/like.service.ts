import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { Repository } from 'typeorm';
import { Like } from './like.entity';
import { PaginationDto } from '@shared/pagination.dto';
import { PaginatedLikesDto } from './dto/paginatedLikes.dto';
import { getTotalPages } from 'src/utils/get-total-pages';
import { LikesDto } from './dto/likes.dto';
import { CustomValidation } from 'src/utils/custom-validation';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async addLikeProduct(
    userId: number,
    { productId }: LikesDto,
  ): Promise<Like[]> {
    const [product, user] = await Promise.all([
      this.productRepository.findOne(productId),
      this.userRepository.findOne(userId),
    ]);

    if (!product) {
      new CustomValidation().notFound('Товар', 'productId', productId, product);
    }

    const productLike = await this.likesRepository.findOne({
      where: { product: product.id, user: userId },
    });

    if (!productLike) {
      await this.likesRepository.save({ user, product });
      return await this.likesRepository
        .createQueryBuilder('likes')
        .select()
        .where('likes.user = :id', { id: userId })
        .leftJoin('likes.product', 'product')
        .addSelect(['product.id'])
        .getMany();
    } else {
      await this.likesRepository.delete(productLike.id);
      return null;
    }
  }

  async getUserLikesProduct(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedLikesDto> {
    const page = Number(paginationDto.page);
    const limit = Number(paginationDto.limit) || 10;
    const skippedItems = (page - 1) * limit || 0;

    const [data, count]: [
      Like[],
      number,
    ] = await this.likesRepository
      .createQueryBuilder('likes')
      .select()
      .where('likes.user = :id', { id: userId })
      .orderBy('likes.createdAt', 'DESC')
      .leftJoin('likes.user', 'user')
      .addSelect(['user.id'])
      .leftJoin('likes.product', 'product')
      .addSelect([
        'product.id',
        'product.name',
        'product.price',
        'product.discountedPrice',
        'product.key',
        'product.url',
        'product.availability',
      ])
      .leftJoin('product.category', 'category')
      .addSelect(['category.key'])
      .leftJoin('product.mainImg', 'mainImg')
      .addSelect(['mainImg.name'])
      .leftJoinAndSelect('product.characteristicValue', 'characteristicValue')
      .take(limit)
      .skip(skippedItems)
      .getManyAndCount();

    const totalPages = getTotalPages(count, limit, page);
    return { data, count, totalPages };
  }

  async getLikeProduct(userId: number, productsId): Promise<Like[]> {
    const takeIdFromRequest = productsId.id
      .split(',')
      .map((item) => Number(item));

    const likesProduct = await this.likesRepository
      .createQueryBuilder('likes')
      .select()
      .where('likes.product IN (:...id)', { id: takeIdFromRequest })
      .where('likes.user = :id', { id: userId })
      .leftJoin('likes.product', 'product')
      .addSelect(['product.id'])
      .getMany();

    if (!likesProduct) {
      return null;
    }

    return likesProduct;
  }
}
