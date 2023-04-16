import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from '../user/user.entity';
import { Product } from '../product/product.entity';
import { Like } from './like.entity';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { jwtConfig } from '../configs/jwt/jwt-module-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Like, User, Product]),
    JwtModule.register(jwtConfig),
  ],
  providers: [LikeService],
  controllers: [LikeController],
  exports: [TypeOrmModule],
})
export class LikeModule {}
