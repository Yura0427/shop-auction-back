import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { FiltersController } from './filters.controller';
import { FiltersService } from './filters.service';
import { Product } from '../product/product.entity';
import { Category } from '../category/category.entity';
import { Characteristic } from '../characteristics/characteristics.entity';
import { CharacteristicValue } from '../characteristics-values/characteristics-values.entity';
import { jwtConfig } from '../configs/jwt/jwt-module-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      Characteristic,
      CharacteristicValue,
    ]),
    JwtModule.register(jwtConfig),
  ],
  controllers: [FiltersController],
  providers: [FiltersService],
})
export class FiltersModule {}
