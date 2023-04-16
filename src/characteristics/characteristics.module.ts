import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { CharacteristicsController } from './characteristics.controller';
import { CharacteristicsService } from './characteristics.service';
import { Category } from '../category/category.entity';
import { Characteristic } from './characteristics.entity';
import { CharacteristicGroup } from '../characteristic-group/characteristic-group.entity';
import { jwtConfig } from '../configs/jwt/jwt-module-config';
import { CharacteristicValue } from '../characteristics-values/characteristics-values.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        Characteristic,
        Category, 
        CharacteristicGroup,
        CharacteristicValue
      ]),
    JwtModule.register(jwtConfig),
  ],
  exports: [TypeOrmModule, CharacteristicsModule],
  controllers: [CharacteristicsController],
  providers: [CharacteristicsService],
})
export class CharacteristicsModule {}
