import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { SliderAnimationController } from './slider-animation.controller';
import { SliderAnimation } from './slider-animations.entity';
import { SliderAnimationService } from './slider-animations.service';
import { jwtConfig } from '../configs/jwt/jwt-module-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([SliderAnimation]),
    JwtModule.register(jwtConfig),
  ],
  exports: [TypeOrmModule],
  controllers: [SliderAnimationController],
  providers: [SliderAnimationService],
})
export class SliderAnimationsModule {}
