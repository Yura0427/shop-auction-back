import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

import { Slide } from './slide.entity';
import { SlideService } from './slides.service';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import { IDeleteMessage } from '../interfaces/delete-message.interface';
import { UpdateSlideVisibility } from './dto/update-slide-visibility';
import { ImageUtilsService } from '../image/image-utils.service';
import { ForbiddenExceptionFilter } from '../utils/http-exception.filter';
import { ISlideImagesArr } from './interfaces/slide.interface';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import {
  PaginatedSlideDtoReq,
  PaginatedSlideDtoRes,
} from './dto/paginatedSlide.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthorizedGuard } from '../auth/guards/authorized.guard';

@Controller('slide')
@UseInterceptors(LoggingInterceptor)
export class SlideController {
  constructor(private readonly slideService: SlideService) {}

  @Get()
  public find(
    @Query() paginationDto: PaginatedSlideDtoReq,
  ): Promise<PaginatedSlideDtoRes> {
    return this.slideService.find(paginationDto);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateSlideDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'imageMobile', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: process.env.IMG_TEMP,
          filename: ImageUtilsService.customImageFileName,
        }),
        fileFilter: ImageUtilsService.imageFileFilter,
      },
    ),
  )
  @UsePipes(ValidationPipe)
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  public createSlide(
    @Body() slide: CreateSlideDto,
    @UploadedFiles() files: ISlideImagesArr,
  ): Promise<Slide> {
    return this.slideService.createSlide(slide, files);
  }

  @Post('/:id')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async deleteSlide(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: PaginatedSlideDtoReq,
  ): Promise<IDeleteMessage> {
    return this.slideService.deleteSlide(id,body);
  }

  @Patch('/:id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateSlideDto })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'imageMobile', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: process.env.IMG_TEMP,
          filename: ImageUtilsService.customImageFileName,
        }),
        fileFilter: ImageUtilsService.imageFileFilter,
      },
    ),
  )
  @UsePipes(ValidationPipe)
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  updateSlide(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSlideDto,
    @UploadedFiles() files: ISlideImagesArr,
  ): Promise<Slide> {
    return this.slideService.updateSlide(id, dto, files);
  }

  @Get('/img/:imgName')
  async getSlideImage(
    @Param('imgName') imgName: string,
    @Res() res: Response,
  ): Promise<void> {
    return this.slideService.getSlideImage(imgName, res);
  }

  @Patch('/visibility/:id')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  @UsePipes(ValidationPipe)
  async updateSlideVisibility(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSlideVisibility,
  ): Promise<Slide> {
    return this.slideService.updateSlideVisibility(id, dto);
  }
}
