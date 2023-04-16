import { Module } from '@nestjs/common';
import { ImageUtilsService } from './image-utils.service';

@Module({
  providers:[ImageUtilsService],
  exports: [ImageUtilsService]
})

export class ImageUtilsModule {}
