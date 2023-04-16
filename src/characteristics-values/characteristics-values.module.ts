import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { CharacteristicsValuesController } from './characteristics-values.controller';
import { CharacteristicsValuesService } from './characteristics-values.service';
import { Characteristic } from '../characteristics/characteristics.entity';
import { CharacteristicValue } from './characteristics-values.entity';
import { Product } from '../product/product.entity';
import { jwtConfig } from '../configs/jwt/jwt-module-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Characteristic, Product, CharacteristicValue]),
    JwtModule.register(jwtConfig),
  ],
  exports: [TypeOrmModule],
  controllers: [CharacteristicsValuesController],
  providers: [CharacteristicsValuesService],
})
export class CharacteristicsValuesModule {}
