import * as fs from 'fs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { Repository, TreeRepository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Slide } from './slide.entity';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from '../slide/dto/update-slide.dto';
import { ImageUtilsService } from '../image/image-utils.service';
import { File } from '../files/files.entity';
import { SlideImages } from './slide.images';
import { ISlideImagesArr } from './interfaces/slide.interface';
import { IDeleteMessage } from '../interfaces/delete-message.interface';
import { UpdateSlideVisibility } from './dto/update-slide-visibility';
import { getTotalPages, takeSkipCalculator } from 'src/utils/get-total-pages';
import {
  PaginatedSlideDtoRes,
  PaginatedSlideDtoReq,
} from './dto/paginatedSlide.dto';

@Injectable()
export class SlideService {
  constructor(
    @InjectRepository(Slide)
    private readonly slideRepository: TreeRepository<Slide>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private imageUtilsService: ImageUtilsService,
  ) {}

  public async find(
    paginationDto: PaginatedSlideDtoReq,
  ): Promise<PaginatedSlideDtoRes> {
    const {
      page = 1,
      limit = 10,
      sort = 'id',
      sortDirect = 'asc',
    } = paginationDto;
    const { skip, take } = takeSkipCalculator(limit, page);
    const [data, count] = await this.slideRepository.findAndCount({
      take,
      skip,
      order: {
        [sort]: sortDirect.toUpperCase(),
      },
    });
    const totalPages = getTotalPages(count, limit, page);
    return { data, count, totalPages, page };
  }

  public async createSlide(
    dto: CreateSlideDto,
    files: ISlideImagesArr,
  ): Promise<Slide> {
    const slideImages = new SlideImages(files);
    const filesNames = slideImages.getNamesKeys();
    const slide = await this.slideRepository.save({
      ...dto,
      ...filesNames,
    });
    if (!slide) {
      fs.promises.unlink(files.image[0].path);
      fs.promises.unlink(files.imageMobile[0].path);
      throw new BadRequestException(`Файли не було збережено у базу`);
    }

    await this.imageUtilsService.moveFilesToUploads(slideImages);

    for (const imageKeyName in filesNames) {
      if (Object.prototype.hasOwnProperty.call(filesNames, imageKeyName)) {
        const fileImage = await this.fileRepository.save({
          name: filesNames[imageKeyName],
          slide: slide,
        });
      }
    }

    if (process.env.NODE_ENV !== 'local') {
      const fileNames = slideImages.getNames();
      await this.imageUtilsService
        .uploadToStorage(fileNames)
        .catch(console.error);
      await this.imageUtilsService.imageRemover(fileNames);
    }

    return slide;
  }

  async deleteSlide(id: number, body:PaginatedSlideDtoReq): Promise<IDeleteMessage> {
    const slide = await this.slideRepository.findOne(id, {
      relations: ['files'],
    });

    if (!slide) {
      throw new NotFoundException(`Слайд з ід: ${id} не знайдено`);
    }

    const relatedFiles = slide.files;

    if (relatedFiles.length) {
      if (process.env.NODE_ENV !== 'local') {
        // /# gc - Google Cloud
        const gcFileNames = relatedFiles.map(
          (file) => `static/uploads/${file.name}`,
        );
        await this.imageUtilsService.deleteFromStorage(gcFileNames);
      }

      if (process.env.NODE_ENV === 'local') {
        const fileNames = relatedFiles.map((file) => file.name);
        await this.imageUtilsService.imageRemover(fileNames);
      }
    }

    const result =
      (await this.slideRepository.delete(id)) && (await this.find(body));

    return {
      message: `Слайд з ід: ${id} видалено`,
      ...result,
    };
  }

  async updateSlide(
    id: number,
    dto: UpdateSlideDto,
    files: ISlideImagesArr,
  ): Promise<Slide> {
    let slideImages = new SlideImages(files);

    const slide = await this.slideRepository.findOne(id, {
      relations: ['files'],
    });

    if (!slide) {
      throw new NotFoundException(`Слайд з ід: ${id} не знайдено`);
    }

    await this.updateSlidesImages(slide, slideImages);

    await this.slideRepository.update(id, {
      ...dto,
      ...slideImages.getNamesKeys(),
    });

    const slideUpdated = await this.slideRepository.findOne(id);

    const filesNames = slideImages.getNamesKeys();
    for (const imageKeyName in filesNames) {
      const fileImage = await this.fileRepository.save({
        name: filesNames[imageKeyName],
        slide: slideUpdated,
      });
    }

    return slideUpdated;
  }

  async updateSlidesImages(
    slide: Slide,
    slideImages: SlideImages,
  ): Promise<void> {
    if (!slideImages.isEmpty()) {
      this.removeSlideImages(slide, slideImages);

      await this.imageUtilsService.moveFilesToUploads(slideImages);

      if (process.env.NODE_ENV !== 'local') {
        const fileNames = slideImages.getNames();
        await this.imageUtilsService
          .uploadToStorage(fileNames)
          .catch(console.error);
        await this.imageUtilsService.imageRemover(fileNames);
      }
    }
  }

  //todo: apply checking if not deleted
  async removeSlideImages(
    oldSlide: Slide,
    newSlideImages: SlideImages,
  ): Promise<boolean> {
    const filesToRemoveNames = this._extractFilesNamesByKeys(
      oldSlide,
      newSlideImages,
    );
    if (process.env.NODE_ENV === 'local') {
      await this.imageUtilsService.imageRemover(filesToRemoveNames);
    } else {
      // remove from Google Cloud
      await this.imageUtilsService.deleteFromStorage(
        filesToRemoveNames.map((fileName) => `static/uploads/${fileName}`),
      );
    }
    const filesId = this._extractFilesIdByKeys(oldSlide, newSlideImages);
    await this.fileRepository.delete(filesId);
    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }

  private _extractFilesNamesByKeys(
    oldSlide: Slide,
    newSlideImages: SlideImages,
  ) {
    const newImages = newSlideImages.getNamesKeys();
    let filesToRemoveNames = [];
    for (const fileKey in newImages) {
      filesToRemoveNames.push(oldSlide[fileKey]);
    }
    return filesToRemoveNames;
  }

  private _extractFilesIdByKeys(oldSlide: Slide, newSlideImages: SlideImages) {
    const newImages = newSlideImages.getNamesKeys();
    let filesToRemoveNames = [];
    let filesToRemove = [];
    for (const fileKey in newImages) {
      for (const file of oldSlide.files) {
        if (file.name == oldSlide[fileKey]) {
          filesToRemove.push(file);
        }
      }
    }
    return filesToRemove.map((file) => file.id);
  }

  async getSlideImage(imgName: string, res: Response): Promise<void> {
    try {
      await fs.promises.stat(`${process.env.IMG_PATH}/${imgName}`);
      return res.sendFile(imgName, { root: process.env.IMG_PATH });
    } catch (error) {
      throw new NotFoundException(`Зображення з назвою ${imgName} не знайдено`);
    }
  }

  async updateSlideVisibility(
    id: number,
    dto: UpdateSlideVisibility,
  ): Promise<Slide> {
    const slide = await this.slideRepository.findOne(id);

    if (!slide) {
      throw new NotFoundException(`Слайд з ід: ${id} не знайдено`);
    }

    slide.isShown = dto.isShown;
    await this.slideRepository.update(slide.id, { ...slide });

    return slide;
  }
}
