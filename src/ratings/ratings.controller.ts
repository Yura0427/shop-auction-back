import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Request,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthorizedGuard } from '../auth/guards/authorized.guard';

import { RatingsDto } from './dto/ratings.dto';
import { RatingsService } from './ratings.service';
import { IRequest } from 'src/user/interfaces/request.interface';
import { Product } from '../product/product.entity';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';

@ApiTags('Ratings')
@Controller('ratings')
@UseInterceptors(LoggingInterceptor)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  async addRatings(
    @Request() req: IRequest,
    @Body() body: RatingsDto,
  ): Promise<Product> {
    return this.ratingsService.addRatings(req.user.id, body);
  }

  @Get('/avgRating/:id')
  async getAvgRatingById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Product> {
    return this.ratingsService.getRatingById(id);
  }
}
