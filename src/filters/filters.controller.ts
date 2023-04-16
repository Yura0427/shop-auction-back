import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { FiltersService } from './filters.service';
import { GetFilteredProductDto } from './dto/getFilteredProduct.dto';
import { Product } from './../product/product.entity';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';

@ApiTags('Filters')
@Controller('filters')
@UseInterceptors(LoggingInterceptor)
export class FiltersController {
  constructor(private filtersService: FiltersService) {}

  @Post()
  async getFilteredProducts(
    @Body() dto: GetFilteredProductDto,
  ): Promise<{ product: Product[]; count: number; }> {
    return this.filtersService.getFilteredProducts(dto);
  }
}
