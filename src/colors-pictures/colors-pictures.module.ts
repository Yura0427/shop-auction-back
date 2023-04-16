import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { ColorsPicturesService } from './colors-pictures.service';
import { ColorsPicturesFiles } from './colors-pictures.entity';
import { ColorsPicturesController } from './colors-pictures.controller';
import { jwtConfig } from '../configs/jwt/jwt-module-config';
import { ImageUtilsService } from '../image/image-utils.service';
import { SocketModule } from 'src/socket/socket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ColorsPicturesFiles]),
    JwtModule.register(jwtConfig),
    SocketModule,
  ],
  providers: [ColorsPicturesService, ImageUtilsService],
  controllers: [ColorsPicturesController],
})
export class ColorsPicturesModule {}
