import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from '../user/user.entity';
import { Product } from '../product/product.entity';
import { Rating } from './ratings.entity';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { jwtConfig } from '../configs/jwt/jwt-module-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating, User, Product]),
    JwtModule.register(jwtConfig),
  ],
  providers: [RatingsService],
  controllers: [RatingsController],
  exports: [TypeOrmModule],
})
export class RatingsModule {}
