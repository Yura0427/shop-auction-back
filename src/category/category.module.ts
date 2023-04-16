import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { Category } from './category.entity';
import { CategoryController } from './category.controller';
import { CategoryService } from './categories.service';
import { ProductModule } from '../product/product.module';
import { CharacteristicGroup } from '../characteristic-group/characteristic-group.entity';
import { Product } from '../product/product.entity';
import { Characteristic } from '../characteristics/characteristics.entity';
import { jwtConfig } from '../configs/jwt/jwt-module-config';
import { ImageUtilsModule } from 'src/image/image-utils.module';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      CharacteristicGroup,
      Product,
      Characteristic,
    ]),
    forwardRef(() => ProductModule),
    ImageUtilsModule,
    FilesModule,
    JwtModule.register(jwtConfig),
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryModule, CategoryService],
})
export class CategoryModule {}
