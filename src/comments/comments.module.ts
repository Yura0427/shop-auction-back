import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/product/product.entity';
import { User } from 'src/user/user.entity';

import { CommentController } from './comments.controller';
import { Comment } from './comments.entity';
import { CommentService } from './comments.service';
import { jwtConfig } from '../configs/jwt/jwt-module-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, User, Comment]),
    JwtModule.register(jwtConfig),
  ],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentsModule {}
