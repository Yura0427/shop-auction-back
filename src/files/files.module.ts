import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { File } from './files.entity';
import { FilesService } from './files.service';
import { ImageUtilsModule } from '../image/image-utils.module';
import { ImageUtilsService } from '../image/image-utils.service';

@Module({
  imports: [TypeOrmModule.forFeature([File]), ImageUtilsModule],
  exports: [TypeOrmModule, FilesService],
  providers: [FilesService, ImageUtilsService],
})
export class FilesModule {}
