import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { ProductController } from './product.controller';
import { Product } from './product.entity';
import { ProductService } from './product.service';
import { Category } from 'src/category/category.entity';
import { File } from 'src/files/files.entity';
import { Parameters } from '../parameters/parameters.entity';
import { Rating } from '../ratings/ratings.entity';
import { Comment } from '../comments/comments.entity';
import { FilesService } from 'src/files/files.service';
import { ImageUtilsModule } from '../image/image-utils.module';
import { CharacteristicValue } from '../characteristics-values/characteristics-values.entity';
import { Order } from 'src/orders/orders.entity';
import { ProductToOrder } from 'src/product-to-order/product-to-order.entity';
import { jwtConfig } from '../configs/jwt/jwt-module-config';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      File,
      Parameters,
      Rating,
      CharacteristicValue,
      Comment,
      Order,
      ProductToOrder,
    ]),
    forwardRef(() => CategoryModule),
    ImageUtilsModule,
    JwtModule.register(jwtConfig),
  ],
  exports: [TypeOrmModule, ProductService],
  controllers: [ProductController],
  providers: [ProductService, FilesService],
})
export class ProductModule {}
