import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { Response } from 'express';
import * as path from 'path';

import { IDeleteMessage } from 'src/interfaces/delete-message.interface';
import { File } from './files.entity';
import { ImageUtilsService } from '../image/image-utils.service';
import { Source } from '../image/cropper.enum';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private imageUtilsService: ImageUtilsService,
  ) {}

  async getImage(imgName: string, res: Response): Promise<void> {
    try {
      const avatarPath = path.resolve(process.env.IMG_PATH);
      return res.sendFile(imgName, { root: avatarPath });
    } catch (error) {
      throw new NotFoundException(`Зображення з назвою ${imgName} не знайдено`);
    }
  }

  async deleteImage(
    imgName: string,
    source: null | Source = null,
  ): Promise<IDeleteMessage> {
    try {
      const query = this.fileRepository.createQueryBuilder('files');

      if (process.env.NODE_ENV !== 'local') {
        // /# gc - Google Cloud
        const getFileExt = imgName.split('.')[1];
        let gcFileName: string;

        if (getFileExt === `svg`) {
          gcFileName = `static/uploads/icons/${imgName}`;
        } else if (source === Source.avatar) {
          gcFileName = `static/uploads/${Source.avatar}/${imgName}`;
        } else {
          gcFileName = `static/uploads/${imgName}`;
        }

        await this.imageUtilsService.deleteFromStorage([gcFileName]);
      }

      if (process.env.NODE_ENV === 'local') {
        await this.imageUtilsService.imageRemover([imgName], source);
      }

      await query.delete().where('name = :name', { name: imgName }).execute();

      return { message: `Зображення: ${imgName} успішно видалено` };
    } catch (error) {
      throw new NotFoundException(
        `Зображення з назвою: ${imgName} не знайдено`,
      );
    }
  }
}
