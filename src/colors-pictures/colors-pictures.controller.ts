import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ColorsPicturesFiles } from './colors-pictures.entity';
import { ColorsPicturesService } from './colors-pictures.service';
import { RequestColorsPicturesDto } from './dto/request-colors-pictures.dto';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';

@ApiTags('colors-pictures')
@Controller('colors-pictures')
@UseInterceptors(LoggingInterceptor)
export class ColorsPicturesController {
  constructor(private colorsPicturesService: ColorsPicturesService) {}

  @Get('/')
  @ApiBearerAuth()
  async getColorsPictures(
    @Query() request: RequestColorsPicturesDto,
  ): Promise<ColorsPicturesFiles[]> {
    return this.colorsPicturesService.getColorsPictures(request.colors);
  }
}
