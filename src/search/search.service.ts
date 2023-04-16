import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Product } from '../product/product.entity';
import { Repository } from 'typeorm';
import { Category } from 'src/category/category.entity';
import { User } from 'src/user/user.entity';
import { getTotalPages } from '../utils/get-total-pages';
import { QueryPropertiesDto } from './dto/query-properties-dto';
import { PaginatedSearchItemsDto } from './dto/paginatedSearchItems';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private treeRepository: Repository<Category>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
  async getSearchItemsByCustomQuery(
    query: QueryPropertiesDto,
  ): Promise<PaginatedSearchItemsDto> {
    const { page, limit, ...searchProps } = query;

    if (Object.keys(searchProps).length > 1) {
      throw new BadRequestException(
        'Можна передавати тільки один параметр пошуку',
      );
    }
    const skippedItems = (page - 1) * limit;

    if (searchProps.products) {
      const searchValue = searchProps.products;
      const query = !Number(searchValue)
        ? 'product.name ILIKE :queryName OR product.key = :queryKey'
        : 'product.id = :queryId ';
      const [data, count]: [Product[], number] = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.mainImg', 'mainImg')
        .leftJoinAndSelect('product.files', 'file')
        .where(query, {
          queryName: `%${searchValue}%`,
          queryKey: searchValue,
          queryId: Number(searchValue) ? searchValue : null,
        })
        .orderBy('product.id', 'ASC')
        .take(limit)
        .skip(skippedItems)
        .getManyAndCount();

      const totalPages = getTotalPages(count, limit, page);
      return { data, count, totalPages };
    }
    if (searchProps.categories) {
      const searchValue = searchProps.categories;
      const [data, count]: [Category[], number] = await this.treeRepository
        .createQueryBuilder('category')
        .where(
          'category.name ILIKE :queryName OR category.key = :queryKey OR category.id = :queryId ',
          {
            queryName: `%${searchValue}%`,
            queryKey: searchValue,
            queryId: Number(searchValue) ? searchValue : null,
          },
        )
        .orderBy('category.id', 'ASC')
        .take(limit)
        .skip(skippedItems)
        .getManyAndCount();

      const totalPages = getTotalPages(count, limit, page);

      return { data, count, totalPages };
    }
    if (searchProps.users) {
      const searchValue = searchProps.users;
      const query = searchValue
        && 'user.email ILIKE :queryEmail'
      const [data, count]: [User[], number] = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.comments', 'comments')
        .leftJoinAndSelect('user.role', 'role')
        .leftJoinAndSelect('user.order', 'order')
        .where(query, {
          queryEmail: `%${searchValue}%`
        })
        .take(limit)
        .skip(skippedItems)
        .getManyAndCount();

      const totalPages = getTotalPages(count, limit, page);
      return { data, count, totalPages };
    }
  }
}
