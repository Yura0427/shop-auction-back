import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { Slide } from './slide.entity';
import { SlideController } from './slide.controller';
import { SlideService } from './slides.service';
import { File } from '../files/files.entity';
import { ImageUtilsModule } from '../image/image-utils.module';
import { jwtConfig } from '../configs/jwt/jwt-module-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Slide, File]),
    ImageUtilsModule,
    JwtModule.register(jwtConfig),
  ],
  controllers: [SlideController],
  providers: [SlideService],
  exports: [],
})
export class SlideModule {}
