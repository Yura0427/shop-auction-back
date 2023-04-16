import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Delete,
  UseGuards,
  OnModuleInit,
  UseFilters,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import * as NodeCache from 'node-cache';

import { Category, CustomCategory } from './category.entity';
import { CategoryService } from './categories.service';
import { Product } from 'src/product/product.entity';
import { CreateTreeCategoryDto } from './dto/create-tree-category.dto';
import { DisableCategoryDto } from './dto/disable-category.dto';
import { TreeCategory } from './category';
import { UpdateTreeCategoryDto } from './dto/updateTreeCategory.dto';
import { ForbiddenExceptionFilter } from 'src/utils/http-exception.filter';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { IFile } from 'src/interfaces/file.interface';
import { diskStorage } from 'multer';
import { ImageUtilsService } from 'src/image/image-utils.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthorizedGuard } from '../auth/guards/authorized.guard';

export const cache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 3600,
  deleteOnExpire: true,
});

@ApiTags('Category')
@Controller('category')
@UseInterceptors(LoggingInterceptor)
export class CategoryController implements OnModuleInit {
  constructor(private readonly categoryService: CategoryService) {}

  onModuleInit(): any {
    // #find and cache all the tree-categories on server start
    this.findTrees();

    cache.on('del', async (key) => {
      console.log(`cache ${key} has been removed`);
      await this.findTrees();
    });

    cache.on('set', (key) => {
      console.log(`cache ${key} has been set`);
    });
  }

  @ApiQuery({
    name: 'hideDisabled',
    description: 'Get only enabled categories',
    required: false,
    type: 'boolean',
  })
  @Get('/tree')
  async findTrees(
    @Query('hideDisabled') hideDisabled?: boolean,
  ): Promise<Category[]> {
    return this.categoryService.findTrees(cache, hideDisabled);
  }

  @Get('/tree/:id')
  async getTreeCategoryById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Category> {
    return this.categoryService.getTreeCategoryById(id);
  }

  @Get('/:id/products')
  public getProducts(@Param('id') id: number): Promise<Product[]> {
    return this.categoryService.getProducts(id);
  }

  @ApiQuery({
    name: 'hideDisabled',
    description: 'Get only enabled categories',
    required: false,
    type: 'boolean',
  })
  @Get('tree/key/:key')
  async getTreeCategoryByKey(
    @Param('key') key: string,
    @Query('hideDisabled') hideDisabled?: boolean,
  ): Promise<CustomCategory> {
    return this.categoryService.getTreeCategoryByKey(key, hideDisabled);
  }

  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  @Post('/tree')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateTreeCategoryDto })
  @UseInterceptors(
    FileInterceptor('icon', {
      storage: diskStorage({
        destination: process.env.IMG_TEMP,
        filename: ImageUtilsService.customIconFileName,
      }),
      fileFilter: ImageUtilsService.imageFileFilter,
    }),
  )
  public createTreeCategory(
    @UploadedFile() file: IFile,
    @Body() dto: CreateTreeCategoryDto,
  ): Promise<TreeCategory> {
    return this.categoryService.createTreeCategory(dto, cache, file);
  }

  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  @Patch('/tree')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateTreeCategoryDto })
  @UseInterceptors(
    FileInterceptor('icon', {
      storage: diskStorage({
        destination: process.env.IMG_TEMP,
        filename: ImageUtilsService.customIconFileName,
      }),
      fileFilter: ImageUtilsService.imageFileFilter,
    }),
  )
  async updateTreeCategory(
    @UploadedFile() file: IFile,
    @Body() dto: UpdateTreeCategoryDto,
  ) {
    return this.categoryService.updateTreeCategory(dto, cache, file);
  }

  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  @Post('/category-images')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: process.env.IMG_TEMP,
        filename: ImageUtilsService.imageCategoryName,
      }),
    }),
  )
  async uploadCategoryImage(@UploadedFiles() files: IFile[]) {
    return await this.categoryService.uploadCategoryImage(files);
  }

  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  @Patch('/tree/disablecategories')
  async disableEnableCategory(@Body() dto: DisableCategoryDto) {
    return this.categoryService.disableEnableCategory(dto, cache);
  }

  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  @Delete('/tree/:id')
  async deleteTreeCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.deleteTreeCategory(id, cache);
  }
}
