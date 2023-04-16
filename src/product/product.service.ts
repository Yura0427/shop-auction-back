import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';

import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './product.entity';
import { UpdateProductDto } from './dto/update-product.dto';
import { Between, ILike, In, Like, Raw, Repository } from 'typeorm';
import { Category } from 'src/category/category.entity';
import { File } from 'src/files/files.entity';
import { UploadImageDto } from './dto/upload-image.dto';
import { GetNewProductDto } from './dto/product.dto';
import { ChangeMainImgDto } from './dto/change-main-img.dto';
import { IFile } from '../interfaces/file.interface';
import { IDeleteMessage } from '../interfaces/delete-message.interface';
import { Parameters } from '../parameters/parameters.entity';
import { INewArrivalProducts } from '../interfaces/new-arrival-products-widget.interface';
import { IParameter } from '../interfaces/parameter.interface';
import { CustomValidation } from '../utils/custom-validation';
import { GetProductByCategoryKeyDto } from './dto/get-product-by-category-key.dto';
import { ImageUtilsService } from '../image/image-utils.service';
import { PaginationDto } from '@shared/pagination.dto';
import { getTotalPages } from '../utils/get-total-pages';
import {
  PaginatedAdminProductsDto,
  PaginatedProductsDto,
} from './dto/paginatedProducts.dto';
import { CharacteristicValue } from '../characteristics-values/characteristics-values.entity';
import { Comment } from '../comments/comments.entity';
import { Order } from '../orders/orders.entity';
import { ProductToOrder } from '../product-to-order/product-to-order.entity';
import { AdminProductsDto } from '@shared/adminProducts.dto';
import { FilterDto } from './dto/filter.dto';
import { CategoryService } from '../category/categories.service';
import { cache } from '../category/category.controller';
import { Status } from 'src/orders/orderStatus.enum';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(CharacteristicValue)
    private cvValuesRepository: Repository<CharacteristicValue>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(ProductToOrder)
    private productToOrderRepository: Repository<ProductToOrder>,
    @InjectRepository(Parameters)
    private parametersRepository: Repository<Parameters>,
    @Inject(forwardRef(() => CategoryService))
    private categoryService: CategoryService,
    private imageUtilsService: ImageUtilsService,
  ) {}

  async uploadImage(
    file: IFile,
    { productId }: UploadImageDto,
  ): Promise<File[]> {
    const relatedProduct = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['mainImg'],
    });

    if (!relatedProduct) {
      await fs.promises.unlink(file.path);

      new CustomValidation().notFound(
        'Продукт',
        'id',
        productId,
        relatedProduct,
      );
    }

    const { fileName, isPng, isGif } = this.imageUtilsService.getFileName(file);

    const original = await this.fileRepository.save({
      name: isPng ? `${fileName}.jpeg` : file.filename,
      product: relatedProduct,
    });

    await this.imageUtilsService.imageOptimize(file.filename);

    const cropped = !isGif
      ? await this.fileRepository.save({
          name: isPng ? `cropped-${fileName}.jpeg` : `cropped-${file.filename}`,
          product: relatedProduct,
        })
      : null;

    if (!relatedProduct.mainImg) {
      await this.productRepository.update(productId, { mainImg: cropped });
    }

    if (process.env.NODE_ENV !== 'local') {
      const files = [original.name];

      if (!isGif) {
        files.push(cropped.name);
      }

      await this.imageUtilsService.uploadToStorage(files).catch(console.error);
      await this.imageUtilsService.imageRemover(files);
    }

    return [original, cropped];
  }

  async uploadMultipleImage(
    files: IFile[],
    { productId }: UploadImageDto,
  ): Promise<IFile[]> {
    const relatedProduct = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['mainImg'],
    });

    if (!relatedProduct) {
      files.forEach((file: IFile) => {
        fs.promises.unlink(file.path);
      });

      throw new NotFoundException(`Продукт з id: ${productId} не існує`);
    }

    const mappedFileProps = [];

    await this.imageUtilsService.imageProcessor(files).catch(console.error);

    files.forEach((file: IFile) => {
      const { fileName, isPng, isGif } = this.imageUtilsService.getFileName(
        file,
      );

      mappedFileProps.push({
        name: isPng ? `${fileName}.jpeg` : file.filename,
        product: relatedProduct,
      });

      if (!isGif) {
        mappedFileProps.push({
          name: isPng ? `cropped-${fileName}.jpeg` : `cropped-${file.filename}`,
          product: relatedProduct,
        });
      }
    });

    const images = await this.fileRepository.save(mappedFileProps);

    const croppedImages = images.filter((image) => /^cropped/.test(image.name));
    const sortedDate = croppedImages.sort((a, b) => b.createdAt - a.createdAt);

    if (!relatedProduct.mainImg) {
      await this.productRepository.update(productId, {
        mainImg: sortedDate[0],
      });
    }

    if (process.env.NODE_ENV !== 'local') {
      const filesNameToUpload = mappedFileProps.map((item) => item.name);

      await this.imageUtilsService
        .uploadToStorage(filesNameToUpload)
        .catch(console.error);
      await this.imageUtilsService.imageRemover(filesNameToUpload);
    }

    return images;
  }

  async generateProductUrl(category: Category): Promise<string> {
    const ascCategoryIds = category.mpath
      .slice(0, -1)
      .split('.')
      .slice(0, -1)
      .map((string) => +string);

    const ascCategories = await this.categoryRepository.find({
      where: {
        id: In(ascCategoryIds),
      },
      select: ['id', 'name', 'key'],
    });

    let url = '';

    ascCategoryIds.forEach((id) => {
      const related = ascCategories.find((item) => item.id === id);
      url += `/${related.key}`;
    });
    url += `/${category.key}`;

    return url;
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const { categoryId, ...otherFields } = dto;

    const relatedCategory = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    new CustomValidation().notFound(
      'Категорію',
      'id',
      categoryId,
      relatedCategory,
    );

    const url = await this.generateProductUrl(relatedCategory);

    return this.productRepository.save({
      ...otherFields,
      url,
      category: relatedCategory,
      availability: true,
    });
  }

  async getProduct(
    paginationDto: PaginationDto,
    skipDisabled?: boolean,
  ): Promise<PaginatedProductsDto> {
    const { page, limit } = paginationDto;

    const where = skipDisabled && { disabled: false };

    const takeSkipCalculator = (itemPerPage: number, pageIndex: number) => {
      const take = itemPerPage;
      let skip = 0;

      if (pageIndex > 1) {
        skip = (pageIndex - 1) * take;
      }

      return { take, skip };
    };

    const { skip, take } = takeSkipCalculator(limit, page);

    const [data, count]: [
      Product[],
      number,
    ] = await this.productRepository.findAndCount({
      relations: [
        'category',
        'mainImg',
        'files',
        'characteristicValue',
        'comments',
      ],
      take,
      skip,
      where,
      order: {
        createdAt: 'DESC',
        availability: 'DESC',
        avgRating: 'DESC',
      },
    });

    const totalPages = getTotalPages(count, take, page);
    return { data, count, totalPages };
  }

  async getProductAdmin(
    adminProductsDto: AdminProductsDto,
  ): Promise<PaginatedAdminProductsDto> {
    const {
      page = 1,
      limit = 10,
      sort = 'id',
      sortDirect = 'asc',
      filterId = '',
      filterName = '',
      filterCategory = '',
      filterPrice = '',
      filterShop = '',
      filterSize = '',
    } = adminProductsDto;
    const filterPriceArr = filterPrice ? filterPrice.split(',') : '';

    const key = await this.productRepository.find({
      where: {
        key: filterName,
      },
    });

    let filteredSizesProductsId: number[] = [];
    const allIdsToFind: number[] = [];

    if (filterSize)
      filteredSizesProductsId = await this.getProductsBySize(filterSize);
    if (filterId) allIdsToFind.push(filterId);
    if (filteredSizesProductsId.length)
      allIdsToFind.push(...filteredSizesProductsId);

    const where: FilterDto = {};
    if (filterId && !Number.isNaN(filterId)) where.id = filterId;
    if (filterSize) where.id = In(allIdsToFind);
    if (filterName && key.length === 0) where.name = ILike(`%${filterName}%`);
    if (filterName && key.length !== 0) where.key = Like(`%${filterName}%`);
    if (filterCategory) where.category = { name: ILike(`%${filterCategory}%`) };
    if (filterPriceArr[0] || filterPriceArr[1])
      where.price = Between(filterPriceArr[0], filterPriceArr[1]);
    if (filterShop) where.shopKey = ILike(`%${filterShop}%`);

    const takeSkipCalculator = (itemPerPage: number, pageIndex: number) => {
      const take = itemPerPage;
      let skip = 0;
      if (pageIndex > 1) {
        skip = (pageIndex - 1) * take;
      }
      return { take, skip };
    };

    const { skip, take } = takeSkipCalculator(limit, page);

    const [data, count]: [
      Product[],
      number,
    ] = await this.productRepository.findAndCount({
      relations: [
        'category',
        'mainImg',
        'files',
        'characteristicValue',
        'comments',
      ],
      take,
      skip,
      where,
      order: {
        [sort]: sortDirect.toUpperCase(),
      },
    });

    const priceRange = await this.productRepository
      .createQueryBuilder('products')
      .innerJoin('products.category', 'category')
      .where(where)
      .select('MAX(products.price)', 'max')
      .addSelect('MIN(products.price)', 'min')
      .addSelect((qb) => {
        return qb
          .select('MAX(products.price)', 'max')
          .from(Product, 'products');
      }, 'asoluteMax')
      .addSelect((qb) => {
        return qb
          .select('MIN(products.price)', 'min')
          .from(Product, 'products');
      }, 'asoluteMin')
      .getRawOne();

    const totalPages = getTotalPages(count, take, page);
    return { data, count, totalPages, priceRange };
  }

  async getProductsById(id: number): Promise<Product> {
    const result = await this.productRepository.findOne(id, {
      relations: [
        'category',
        'files',
        'mainImg',
        'characteristicValue',
        'comments',
      ],
    });

    if (!result) {
      throw new NotFoundException(`Продукт з ID: ${id} не знайдено`);
    }

    return result;
  }

  async getProductsByCategoryId(categoryId: number): Promise<Product[]> {
    return await this.productRepository.find({
      where: { category: categoryId },
      relations: ['files'],
    });
  }

  async getProductByKey(key: string): Promise<Product> {
    const result = await this.productRepository.findOne({
      where: { key },
      relations: [
        'category',
        'category.characteristicGroup',
        'category.characteristicGroup.characteristic',
        'mainImg',
        'files',
        'characteristicValue',
        'comments',
      ],
    });

    if (!result) {
      throw new NotFoundException(`Продукт з ключем: ${key} не існує`);
    }

    const ascCategoryIds = result.category.mpath
      .slice(0, -1)
      .split('.')
      .slice(0, -1)
      .map((string) => +string);

    const ascCategories = await this.categoryRepository.find({
      where: {
        id: In(ascCategoryIds),
      },
      select: ['id', 'name', 'key'],
    });

    return { ...result, category: { ...result.category, ascCategories } };
  }

  async deleteProducts(id: number): Promise<IDeleteMessage> {
    const product = await this.productRepository.findOne(id, {
      relations: ['files', 'characteristicValue'],
    });

    if (!product) {
      throw new NotFoundException(`Продукт з ID: ${id} не знайдено`);
    }

    const { productToOrder } = await this.productRepository.findOne(id, {
      relations: ['productToOrder'],
    });

    if (productToOrder?.length) {
      await this.productRepository.update(id, {
        disabled: true,
      });
    } else {
      if (product.files.length) {
        if (process.env.NODE_ENV !== 'local') {
          // /# gc - Google Cloud
          const gcFileNames = product.files.map(
            (file) => `static/uploads/${file.name}`,
          );
          await this.imageUtilsService.deleteFromStorage(gcFileNames);
        }

        if (process.env.NODE_ENV === 'local') {
          const fileNames = product.files.map((file) => file.name);
          await this.imageUtilsService.imageRemover(fileNames);
        }
      }
      const characteristicValuesIds = product.characteristicValue.map(
        (value) => value.id,
      );
      if (characteristicValuesIds.length) {
        await this.cvValuesRepository.delete(characteristicValuesIds);
      }

      await this.productRepository.delete(id);
      return { message: `Продукт з ID: ${id} було видалено` };
    }
  }

  private async getOrderSum(orderId: number): Promise<any> {
    const {
      sum,
      sumWithoutDiscount,
    } = await this.productToOrderRepository
      .createQueryBuilder('productToOrder')
      .select('SUM(amount)', 'sum')
      .addSelect(
        'SUM(productToOrder.amountWithoutDiscount)',
        'sumWithoutDiscount',
      )
      .where('productToOrder.order.id = :id', { id: orderId })
      .getRawOne();

    if (!sum) {
      const message = `Замовлення з ID ${orderId} не знайдено`;
      throw new NotFoundException(message);
    }

    return { sum, sumWithoutDiscount };
  }

  private async recalculateOrderSum(orderId: number): Promise<void> {
    const { sum, sumWithoutDiscount } = await this.getOrderSum(orderId);

    await this.orderRepository.update(
      { id: orderId },
      { amount: sum, amountWithoutDiscount: sumWithoutDiscount },
    );
  }

  async updateProducts(id: number, dto: UpdateProductDto): Promise<Product> {
    if (!Object.keys(dto).length) {
      throw new BadRequestException(
        'Запит на оновлення повинен містити один із таких ключів: name, description, price, categoryId',
      );
    }
    const relatedProduct = await this.productRepository.findOne(id);
    new CustomValidation().notFound('Продукт', 'ID', id, relatedProduct);

    const { categoryId, ...otherFields } = dto;
    const relatedCategory = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    new CustomValidation().notFound(
      'Категорію',
      'id',
      categoryId,
      relatedCategory,
    );

    const url = await this.generateProductUrl(relatedCategory);

    const result = await this.productRepository.update(id, {
      ...otherFields,
      url,
      category: relatedCategory,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Продукт з ID: ${id}  не знайдено.`);
    }

    if (dto.disabled === false) {
      await this.categoryService.disableEnableCategory(
        { id: relatedCategory.id, disable: false },
        cache,
        id,
      );
    }

    const productsToOrderWithStatusOpen = await this.productToOrderRepository
      .createQueryBuilder('productsToOrder')
      .leftJoinAndSelect('productsToOrder.product', 'product')
      .where('product.id = :id', { id })
      .leftJoinAndSelect('productsToOrder.order', 'order')
      .andWhere('order.status = :status', { status: Status.OPEN })
      .getMany();

    if (productsToOrderWithStatusOpen) {
      for (const productToOrder of productsToOrderWithStatusOpen) {
        const { id, quantity, product, order } = productToOrder;
        await this.productToOrderRepository.update(
          { id },
          {
            amount: quantity * (product.discountedPrice || product.price),
            amountWithoutDiscount: quantity * product.price,
          },
        );
        await this.recalculateOrderSum(order.id);
      }
    }

    return await this.productRepository.findOne(id, {
      join: {
        alias: 'product',
        leftJoinAndSelect: {
          category: 'product.category',
          file: 'product.files',
          mainImg: 'product.mainImg',
        },
      },
    });
  }

  async getSearchProductsByName(
    name: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedProductsDto> {
    const page = Number(paginationDto.page);
    const limit = Number(paginationDto.limit) || 40;
    const skippedItems = (page - 1) * limit;

    const [data, count]: [Product[], number] = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.mainImg', 'mainImg')
      .leftJoinAndSelect('product.files', 'file')
      .leftJoinAndSelect('product.characteristicValue', 'characteristicValue')
      .leftJoinAndSelect('product.comments', 'comments')
      .where('product.name ILIKE :name AND product.disabled = false', {
        name: `%${name}%`,
      })
      .orderBy('product.avgRating', 'DESC')
      .addOrderBy('product.availability', 'DESC')
      .take(limit)
      .skip(skippedItems)
      .getManyAndCount();

    const totalPages = getTotalPages(count, limit, page);

    return { data, count, totalPages };
  }

  async getNewArrivals({ take }: GetNewProductDto): Promise<Product[]> {
    const uniqCategoryQuery = `select DISTINCT products."categoryId" from (select *
      from products pr
      where pr.disabled = false
      order by pr.availability DESC, pr."updatedAt" DESC
      limit 200) as products
      limit 20;`;

    const uniqCategory = await this.productRepository.query(uniqCategoryQuery);

    const lastProductsQuery = `select id, "createdAt", "updatedAt", name, key, description, price, availability, "avgRating", "numRates", "shopKey", "categoryId",  "mainImgId", disabled, url, "discountedPrice"
    from (select *,
          row_number() over (partition by pr."categoryId" order by pr.availability DESC, pr."updatedAt" DESC) as rn,
          count(*) over (partition by pr."categoryId") count
         from products pr
         where pr."disabled"=false AND pr."mainImgId" IS NOT NULL AND pr."categoryId" in (${uniqCategory
           .map((i) => i.categoryId)
           .join(',')})) as product  
    where rn <= 4
    and count >= 4`;

    const lastProducts = await this.productRepository.query(lastProductsQuery);

    const productsMap = {};
    lastProducts.forEach((item) => {
      item.characteristicValue = [];
      productsMap[item.id] = item;
    });

    const productsIds = lastProducts.map((product) => product.id);
    const mainImgIds = lastProducts.map((product) => product.mainImgId);
    const categoryIds = lastProducts.map((product) => product.categoryId);

    const comments = await this.commentsRepository.find({
      where: { productId: In(productsIds) },
    });

    const cvValues = await this.cvValuesRepository.query(
      `select * from "characteristicsValues" cv where cv."productId" IN (${productsIds.join(
        ',',
      )})`,
    );
    const mainImgs = await this.fileRepository.query(
      `select f.id, f."productId", f.name from files f where f."id" IN (${mainImgIds.join(
        ',',
      )})`,
    );
    const categories = await this.categoryRepository.query(
      `select ct.id, ct.name, ct.key from "categories" ct where ct.id IN (${categoryIds.join(
        ',',
      )})`,
    );

    const categoriesMap = {};
    categories.forEach((ct) => (categoriesMap[ct.id] = ct));

    cvValues.forEach((cv) => {
      if (cv.enumValue) cv.enumValue = cv.enumValue.split(',');
      productsMap[cv.productId].characteristicValue.push(cv);
    });

    mainImgs.forEach((img) => {
      productsMap[img.productId].mainImg = img;
    });

    lastProducts.forEach((item) => {
      item.category = categoriesMap[item.categoryId];
    });

    lastProducts.forEach((item) => {
      const productComments = comments.filter(
        (comment) => comment.productId === item.id,
      );
      item.comments = productComments;
    });

    return lastProducts;
  }

  async getParameter(name: string): Promise<any> {
    const parameters = await this.parametersRepository.findOne({
      name,
    });

    if (!parameters) {
      return await this.createDefaultParameters();
    }

    return parameters;
  }

  async createDefaultParameters(): Promise<Parameters[]> {
    const defaultParameters: IParameter[] = [
      {
        name: 'widgets',
        settings: {
          newArrivals: { quantity: 4, isWidgetActive: false },
          popularItems: { quantity: 4, isWidgetActive: false },
        },
      },
    ];

    return this.parametersRepository.save(defaultParameters);
  }

  async getNewArrivalProductsWithParameter(
    name: string,
  ): Promise<INewArrivalProducts> {
    const {
      settings: {
        newArrivals: { quantity, isWidgetActive },
      },
    } = await this.getParameter(name);
    const newProducts = await this.getNewArrivals({ take: quantity });

    return {
      isWidgetActive: isWidgetActive,
      newArrivalProducts: newProducts,
    };
  }

  async changePreviewImg({
    productId,
    imgName,
  }: ChangeMainImgDto): Promise<Product> {
    const relatedImg = await this.fileRepository.findOne({
      where: { name: imgName, product: productId },
    });

    if (!relatedImg) {
      throw new NotFoundException(
        `Зображення з ім'ям ${imgName} не знайдено або воно не належить продукту з ID ${productId}`,
      );
    }

    const result = await this.productRepository.update(productId, {
      mainImg: relatedImg,
    });

    if (!result.affected) {
      throw new NotFoundException(`Продукт з ID ${productId} не знайдено`);
    }

    return await this.productRepository.findOne({
      where: { id: productId },
      relations: ['files', 'mainImg'],
    });
  }

  async getProductsByCategoryKey(
    categoryKey: string,
    query: GetProductByCategoryKeyDto,
  ): Promise<{ products: Product[]; count: number }> {
    const category = await this.categoryRepository.findOne({
      where: { key: categoryKey },
    });
    new CustomValidation().notFound('Категорію', 'key', categoryKey, category);

    const { take, skip } = query;

    const [products, count] = await this.productRepository.findAndCount({
      where: { category, disabled: false },
      take,
      skip,
      relations: [
        'category',
        'files',
        'characteristicValue',
        'mainImg',
        'comments',
      ],
      order: { availability: 'DESC', avgRating: 'DESC' },
    });

    return { products: products, count: count };
  }

  async getProductsInListCategory(
    categoryKey: string,
    query: GetProductByCategoryKeyDto,
  ): Promise<{ products: Product[]; count: number }> {
    try {
      const category = await this.categoryRepository.findOne({
        where: { key: categoryKey },
      });
      new CustomValidation().notFound(
        'Категорію',
        'key',
        categoryKey,
        category,
      );

      const { take, skip } = query;

      const categoryWithProducts = await this.categoryRepository.find({
        where: {
          mpath: Raw(
            (alias) =>
              `string_to_array(${alias}, '.') && array['${category.id}']`,
          ),
        },
        relations: ['children'],
      });

      const filteredCategories = categoryWithProducts.filter(
        (category) => !category.children.length,
      );

      const categoryIds = filteredCategories.map((category) => category.id);

      const [data, count] = await this.productRepository.findAndCount({
        where: {
          category: In(categoryIds),
          disabled: false,
        },
        relations: ['mainImg', 'characteristicValue', 'comments'],
        order: { availability: 'DESC', avgRating: 'DESC' },
        take,
        skip,
      });

      return { products: data, count };
    } catch (e) {
      console.log(e);
    }
  }

  async getProductsBySize(size: string): Promise<number[]> {
    const parametersWithProducts = await this.cvValuesRepository
      .createQueryBuilder('chars')
      .where('chars.jsonValue is not null')
      .leftJoinAndSelect('chars.product', 'product')
      .getMany();

    const productsId = parametersWithProducts
      .filter(
        ({ jsonValue }) =>
          typeof jsonValue === 'object' &&
          jsonValue !== null &&
          Array.isArray(jsonValue[Object.keys(jsonValue)[0]]) &&
          jsonValue[Object.keys(jsonValue)[0]].includes(size),
      )
      .map((param) => param.product.id);

    return productsId;
  }
}
