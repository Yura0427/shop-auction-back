import {
  Controller,
  Get,
  UseGuards,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { SearchService } from './search.service';
import { QueryPropertiesDto } from './dto/query-properties-dto';
import { PaginatedSearchItemsDto } from './dto/paginatedSearchItems';
import { AuthorizedGuard } from '../auth/guards/authorized.guard';
import { ForbiddenExceptionFilter } from 'src/utils/http-exception.filter';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import {AdminGuard} from "../auth/guards/admin.guard";

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(AuthorizedGuard)
@Controller('search')
@UseInterceptors(LoggingInterceptor)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('/admin')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async getSearchItemsByCustomQuery(
    @Query() queryProps: QueryPropertiesDto,
  ): Promise<PaginatedSearchItemsDto> {
    return this.searchService.getSearchItemsByCustomQuery(queryProps);
  }
}
