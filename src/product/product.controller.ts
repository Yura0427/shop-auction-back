import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateProductDto } from './dto/create-product.dto';
import { Product } from 'src/product/product.entity';
import { ProductService } from './product.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { UploadImageDto } from './dto/upload-image.dto';
import { File } from 'src/files/files.entity';
import { GetNewProductDto } from './dto/product.dto';
import { ChangeMainImgDto } from './dto/change-main-img.dto';
import { IFile } from '../interfaces/file.interface';
import { IDeleteMessage } from '../interfaces/delete-message.interface';
import { INewArrivalProducts } from '../interfaces/new-arrival-products-widget.interface';
import { GetProductByCategoryKeyDto } from './dto/get-product-by-category-key.dto';
import { FilesService } from 'src/files/files.service';
import { ImageUtilsService } from '../image/image-utils.service';
import { PaginationDto } from '@shared/pagination.dto';
import {
  PaginatedAdminProductsDto,
  PaginatedProductsDto,
} from './dto/paginatedProducts.dto';
import * as path from 'path';
import { ForbiddenExceptionFilter } from '../utils/http-exception.filter';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { AdminProductsDto } from '@shared/adminProducts.dto';
import { ApiAdminProductResponse } from './product.decorators';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthorizedGuard } from '../auth/guards/authorized.guard';

@ApiTags('Product')
@Controller('product')
@UseInterceptors(LoggingInterceptor)
export class ProductController {
  constructor(
    private productService: ProductService,
    private filesService: FilesService,
  ) {}

  @Post('images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageDto })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: path.resolve(process.env.IMG_TEMP),
        filename: ImageUtilsService.customImageFileName,
      }),
      fileFilter: ImageUtilsService.imageFileFilter,
    }),
  )
  @UsePipes(ValidationPipe)
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async uploadProductPhoto(
    @UploadedFile() file: IFile,
    @Body() dto: UploadImageDto,
  ): Promise<File[]> {
    return this.productService.uploadImage(file, dto);
  }

  @Post('multipleImages')
  @UseInterceptors(
    FilesInterceptor('images', 15, {
      storage: diskStorage({
        destination: path.resolve(process.env.IMG_TEMP),
        filename: ImageUtilsService.customImageFileName,
      }),
      fileFilter: ImageUtilsService.imageFileFilter,
    }),
  )
  @UsePipes(ValidationPipe)
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async uploadMultiplePhotos(
    @UploadedFiles() files: IFile[],
    @Body() dto: UploadImageDto,
  ): Promise<IFile[]> {
    return this.productService.uploadMultipleImage(files, dto);
  }

  @Post()
  @UsePipes(ValidationPipe)
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async createProduct(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productService.createProduct(dto);
  }

  @Get()
  async getProducts(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedProductsDto> {
    return this.productService.getProduct(paginationDto, true);
  }

  @Get('/admin')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  @ApiAdminProductResponse()
  async getProductsAdmin(
    @Query() adminProductsDto: AdminProductsDto,
  ): Promise<PaginatedAdminProductsDto> {
    return this.productService.getProductAdmin(adminProductsDto);
  }

  @Get('/category/:categoryKey')
  async getProductsByCategoryKey(
    @Param('categoryKey') categoryKey: string,
    @Query() query: GetProductByCategoryKeyDto,
  ): Promise<{ products: Product[]; count: number }> {
    return this.productService.getProductsByCategoryKey(categoryKey, query);
  }

  @Get('/listCategory/:categoryKey')
  async getProductsInListCategory(
    @Param('categoryKey') categoryKey: string,
    @Query() query: GetProductByCategoryKeyDto,
  ): Promise<{ products: Product[]; count: number }> {
    return this.productService.getProductsInListCategory(categoryKey, query);
  }

  @Get('/newArrivals')
  @ApiCreatedResponse({ type: Product })
  async getNewProducts(@Query() req: GetNewProductDto): Promise<Product[]> {
    return this.productService.getNewArrivals(req);
  }

  @Get('/sliderNewArrivals/:name')
  async getNewProductsWithParameter(
    @Param('name') name: string,
  ): Promise<INewArrivalProducts> {
    return this.productService.getNewArrivalProductsWithParameter(name);
  }

  @Get('/:id')
  async getProductById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Product> {
    return this.productService.getProductsById(id);
  }

  @Get('/category/:categoryId')
  async getProductsByCategoryId(
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ): Promise<Product[]> {
    return this.productService.getProductsByCategoryId(categoryId);
  }

  @Get('search/:name')
  async getSearchProductsByName(
    @Param('name') name: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedProductsDto> {
    return this.productService.getSearchProductsByName(name, paginationDto);
  }

  @Get('/key/:key')
  async getProductByKey(@Param('key') key: string): Promise<Product> {
    return this.productService.getProductByKey(key);
  }

  @Delete('/:id')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async deleteProducts(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IDeleteMessage> {
    return this.productService.deleteProducts(id);
  }

  @Delete('/img/:imgName')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async deleteImageFile(
    @Param('imgName') imgName: string,
  ): Promise<IDeleteMessage> {
    return this.filesService.deleteImage(imgName);
  }

  @Patch('/:id')
  @UsePipes(ValidationPipe)
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.productService.updateProducts(id, dto);
  }

  @Patch('/img/preview')
  @UsePipes(ValidationPipe)
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async changePreviewImg(@Body() dto: ChangeMainImgDto): Promise<Product> {
    return this.productService.changePreviewImg(dto);
  }
}
