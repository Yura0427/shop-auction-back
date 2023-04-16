import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';

import { FeedbackController } from './feedbacks.controller';
import { Feedback } from './feedbacks.entity';
import { FeedbackService } from './feedbacks.service';
import { jwtConfig } from '../configs/jwt/jwt-module-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Feedback]),
    JwtModule.register(jwtConfig),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbacksModule {}
