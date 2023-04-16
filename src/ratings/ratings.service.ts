import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../product/product.entity';
import { RatingsDto } from './dto/ratings.dto';
import { Rating } from './ratings.entity';
import { User } from 'src/user/user.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private ratingsRepository: Repository<Rating>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async addRatings(
    userId: number,
    { productId, currentRating }: RatingsDto,
  ): Promise<Product> {
    const [product, user] = await Promise.all([
      this.productRepository.findOne(productId),
      this.userRepository.findOne(userId),
    ]);

    if (!product) {
      throw new NotFoundException(`Продукт з id: ${productId} не знайдено`);
    }

    const productRating = await this.ratingsRepository.findOne({
      where: { product: product.id, user: userId },
    });

    if (productRating) {
      await this.ratingsRepository.update(productRating.id, {
        user,
        product,
        currentRating,
      });
    } else {
      await this.ratingsRepository.save({
        user,
        product,
        currentRating,
      });
    }
    const allProductRatings = await this.ratingsRepository.find({
      where: { product: product.id },
    });

    let sum = 0;
    const numRates = allProductRatings.length;
    allProductRatings.forEach((item) => (sum += item.currentRating));

    const avgRating = (allProductRatings.length
      ? sum / allProductRatings.length
      : currentRating
    ).toString();

    const result = await this.productRepository.update(productId, {
      avgRating,
      numRates,
    });

    if (!result.affected) {
      throw new NotFoundException(
        `Рейтинг продукту ${product.name} не було встановлено`,
      );
    }

    return this.productRepository.findOne(productId);
  }

  async getRatingById(productId: number): Promise<Product> {
    return await this.productRepository.findOne(productId, {
      select: ['avgRating', 'numRates'],
    });
  }
}
