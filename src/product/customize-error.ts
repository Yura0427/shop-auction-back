import { HttpException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Category } from '../category/category.entity';
import { Product } from './product.entity';
import { CreateTreeCategoryDto } from '../category/dto/create-tree-category.dto';
import { UpdateTreeCategoryDto } from '../category/dto/updateTreeCategory.dto';

interface CustomError extends ErrorEvent {
  code?: string;
  table?: string;
  response?: {
    statusCode: number;
  };
}

export class CustomizeError {
  async checkError(
    error: CustomError,
    repository: Repository<Category | Product>,
    dto: CreateTreeCategoryDto | UpdateTreeCategoryDto,
  ): Promise<HttpException> {
    switch (true) {
      case error.code === '23505' && error.table === 'categories':
        const isKeyExist = await repository.findOne({ key: dto.key });

        if (isKeyExist) {
          throw new HttpException(
            'Ключ категорії повинен бути унікальним',
            401,
          );
        } else {
          throw new HttpException(
            'Назва категорії повинна бути унікальною',
            401,
          );
        }

      default:
        throw new HttpException(error.message, error.response.statusCode);
    }
  }
}
