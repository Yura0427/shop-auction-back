import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository, TreeRepository } from 'typeorm';
import { parseStringPromise } from 'xml2js';
import { HTMLElement, parse } from 'node-html-parser';
import * as fs from 'fs';
import * as path from 'path';
import * as NodeCache from 'node-cache';

import { Parameters } from '../../parameters/parameters.entity';
import { ChatGateway } from '../../socket/socket-console.gateway';
import { ParserDto } from '../parser.dto';
import { ParsersHelperUtils } from '../utils/parserHelper.utils';
import { EParserStatus } from '../utils/parserStatus.enum';
import {
  IParserParams,
  IWMFormattedProduct,
  IWMProduct,
  IWMProductParam,
  SimpleMap,
} from '../parser';
import { ParametersNameEnum } from '../../parameters/parameters.enum';
import { defaultCategories } from '../categiries-servise/tree-default-categories';
import { treeCategories } from '../categiries-servise/tree-categories-keys';
import { Product } from '../../product/product.entity';
import * as BlueBirdPromise from 'bluebird';
import { Category } from '../../category/category.entity';
import { ProductService } from '../../product/product.service';
import { ImageUtilsService } from '../../image/image-utils.service';
import { CategoryService } from '../../category/categories.service';
import { CharacteristicsValuesService } from '../../characteristics-values/characteristics-values.service';
import { ProductToOrder } from '../../product-to-order/product-to-order.entity';
import {
  targetCategories,
  toRemoveFromCharacteristics,
  toRemoveFromName,
} from './content-to-remove';
import {
  ICategory,
  IProduct,
  IProductWithArticleAndAvailable,
} from './white-mandarin';

export const parserCache = new NodeCache({
  stdTTL: 86400,
});

@Injectable()
export class WhiteMandarinParserService {
  constructor(
    @InjectRepository(Parameters)
    private parametersRepository: Repository<Parameters>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private subCategoryRepository: TreeRepository<Category>,
    @InjectRepository(ProductToOrder)
    private productToOrderRepository: Repository<ProductToOrder>,
    @Inject('ProductService')
    private productService: ProductService,
    @Inject('ParsersHelperUtils')
    private parsersHelperUtils: ParsersHelperUtils,
    @Inject('ImageUtilsService')
    private imageUtilsService: ImageUtilsService,
    @Inject('ChatGateway')
    private chatGateway: ChatGateway,
    @Inject('CategoryService')
    private categoryService: CategoryService,
    @Inject('CharacteristicsValuesService')
    private characteristicsValuesService: CharacteristicsValuesService,
  ) {}

  public root = 'https://whitemandarin.org.ua/';
  // public xmlLink =
  //   'https://www.goods-eco.com/content/export/178f1bb4b4bfbf9babdfc98c61a7dc63.xml';
  public xmlLinkUa =
    'https://goods-eco.com/content/export/2f35bfc86323da7e3cb2d2fddc2446d6.xml';
  public shopKey = 'whiteMandarin';
  public isStarted = false;

  public async beginParsing(parserDto: ParserDto) {
    if (this.isStarted) {
      return await this.chatGateway.handleMessage({
        parser: this.shopKey,
        data: '"White mandarin" already sterted',
      });
    }

    await this.chatGateway.saveStatusToDB({
      parser: this.shopKey,
      command: 'Start parsing from White Mandarin',
    });

    await this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: 'Start parsing from White Mandarin',
    });

    this.isStarted = true;

    const params = await this.parametersRepository.findOne({
      name: ParametersNameEnum.parser,
    });

    if (!params) {
      return this.chatGateway.stopMessage({
        parser: this.shopKey,
        command: 'ERROR! Parser settings not found',
      });
    }

    const parserParams = params.settings[this.shopKey];

    let allProductsWithArticleAndAvailable: IProductWithArticleAndAvailable[] = parserCache.get(
      'parserWhiteMandarin',
    );

    console.log(
      `"White Mandarin" parser cache exist: ${Boolean(
        allProductsWithArticleAndAvailable,
      )}`,
    );

    if (!allProductsWithArticleAndAvailable) {
      const siteCategoriesList: ICategory[] = await this.parseCategoriesFromSite();
      const allProducts: IProduct[] = await this.parseProductsListFromSite(
        siteCategoriesList,
      );

      allProductsWithArticleAndAvailable = await this.parseAllProductsWithNameUrlArticleFromSite(
        allProducts,
      );

      parserCache.set(
        'parserWhiteMandarin',
        allProductsWithArticleAndAvailable,
      );
      console.log('"White Mandarin" parser cache set');
    }

    // await fs.promises.writeFile(
    //   path.resolve('../uploads', 'products.json'),
    //   JSON.stringify(allProductsWithNameUrlAricle),
    // );

    // const tempFile = fs.readFileSync(
    //   path.resolve('../uploads', 'products.json'),
    //   'utf8',
    // );

    // const allProductsWithNameUrlAricle: IProductWithArticleAndAvailable[] = JSON.parse(
    //   tempFile,
    // );
    let parsedProducts: number;
    if (this.isStarted) {
      let { data } = await axios(this.xmlLinkUa);
      const shopXml = await parseStringPromise(data);

      // const xml = fs.readFileSync(path.resolve('../uploads', 'wm.xml'));
      // const shopXml = await parseStringPromise(xml);

      const singleCategoriesMap = await this.createCategoriesMap();

      const productsList = [...shopXml.yml_catalog.shop[0].offers[0].offer];
      const parsedProductsList = await this.parseProductsList(
        productsList,
        allProductsWithArticleAndAvailable,
      );

      if (parserDto.update && parserDto.key) {
        parsedProducts = await this.updateOneProduct(
          parsedProductsList,
          parserDto.key,
          singleCategoriesMap,
          parserParams,
        );
      } else {
        parsedProducts = await this.createProductsInDB(
          parsedProductsList,
          singleCategoriesMap,
          parserParams,
        );

        await this.parsersHelperUtils.disableEmptyCategories();
      }
    }

    await this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: 'The process finished...',
    });

    await this.chatGateway.stopMessage({
      parser: this.shopKey,
      lastParsedProduct: parsedProducts,
      command: '-=White Mandarin - parsing finished=-',
    });

    this.isStarted = false;
    return { message: 'White Mandarin - parsing finished' };
  }

  public async checkParserStatus() {
    const allStatuses = await this.parsersHelperUtils.getStatus();
    const parserStatus = allStatuses.find(
      (parser) => parser.parserName === this.shopKey,
    )?.parserStatus;

    if (!parserStatus) {
      return this.chatGateway.stopMessage({
        parser: this.shopKey,
        command: 'ERROR! Settings for "White mandarin" parser not found',
      });
    }

    return parserStatus;
  }

  public async parseCategoriesFromSite() {
    const { data } = await axios(this.root);
    // await fs.promises.writeFile(path.resolve('../uploads', 'wm.txt'), data);

    // const data = fs.readFileSync(path.resolve('../uploads', 'wm.txt'), 'utf8');
    const root: HTMLElement = parse(data);

    const categoriesContainer = root.querySelector(
      '.menu-categories-container',
    );

    const mainCategories = categoriesContainer.querySelector('ul');
    const hasMainSubCategories = mainCategories.querySelectorAll('li > a');

    const categoriesList: ICategory[] = [];

    const categoryBuilder = (category: HTMLElement): ICategory => {
      const url = category.getAttribute('href');
      const name = category.querySelector('span').textContent;

      return { url, name };
    };

    if (hasMainSubCategories.length) {
      hasMainSubCategories.forEach((mainSubCategory: HTMLElement) => {
        const category = categoryBuilder(mainSubCategory);
        if (targetCategories.includes(category.name)) {
          categoriesList.push(category);
        }
      });
    }
    return categoriesList;
  }

  public async parseProductsListFromSite(siteCategoriesList: ICategory[]) {
    const parsedProductList: IProduct[] = [];

    const formattedProduct = (element: HTMLElement): IProduct => {
      const name = element.querySelector('a').textContent;
      const url = element.querySelector('a').getAttribute('href');

      return { name, url };
    };

    const processed = { category: 0 };

    await BlueBirdPromise.map(
      siteCategoriesList,
      async (siteCategory: ICategory) => {
        for (let i = 1; i < 10; i += 1) {
          const status = await this.checkParserStatus();
          try {
            if (status === EParserStatus.started) {
              (async function () {
                await new Promise((resolve) => setTimeout(resolve, 2000));
              })();
              const { data } = await axios.get(
                `${siteCategory.url}page/${i}/?loop=${36 * i}`,
              );

              const root = parse(data);
              const productsList = root.querySelector('.products');

              const allProducts: IProduct[] = [];

              const allProductElements = productsList.querySelectorAll(
                '.product-information',
              );

              if (allProductElements.length) {
                allProductElements.forEach((element: HTMLElement) => {
                  const product = formattedProduct(element);
                  if (product) {
                    allProducts.push(product);
                  }
                });
              }

              parsedProductList.push(...allProducts);
              processed.category += 1;

              this.chatGateway.handleMessage({
                parser: this.shopKey,
                data: `Processed ${processed.category} category from site`,
              });
            } else {
              this.isStarted = false;
            }
          } catch (error) {
            break;
          }
        }
      },
      { concurrency: 1 },
    );

    return parsedProductList;
  }

  public async parseAllProductsWithNameUrlArticleFromSite(
    allProducts: IProduct[],
  ) {
    const allProductsWithNameUrlAricle: IProductWithArticleAndAvailable[] = [];

    const processed = { product: 0, allProducts: allProducts.length };

    await BlueBirdPromise.map(
      allProducts,
      async (product: IProduct) => {
        const status = await this.checkParserStatus();
        if (status === EParserStatus.started) {
          (async function () {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          })();

          const { data } = await axios.get(product.url);
          const parsedProduct = parse(data);

          const article = parsedProduct.querySelector('.sku')?.textContent;
          let available = true;
          if (
            parsedProduct.querySelector('.stock')?.textContent ===
            'Нет в наличии'
          ) {
            available = false;
          }
          if (article) {
            allProductsWithNameUrlAricle.push({
              ...product,
              article,
              available,
            });
          }
          processed.product += 1;

          this.chatGateway.handleMessage({
            parser: this.shopKey,
            data: `Processed ${processed.product} product out of ${processed.allProducts} from site`,
          });
        } else {
          this.isStarted = false;
        }
      },
      { concurrency: 1 },
    );
    return allProductsWithNameUrlAricle;
  }

  public async createCategoriesMap(): Promise<SimpleMap[]> {
    this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: 'Starting creating categories',
    });
    await this.parsersHelperUtils.createMainCategories(defaultCategories, null);

    const simpleCategoriesMap = await this.parsersHelperUtils.buildEasyCategoryMap(
      treeCategories,
    );
    return simpleCategoriesMap;
  }

  public async parseProductsList(
    productsList: IWMProduct[],
    allProductsFromSite: IProductWithArticleAndAvailable[],
  ) {
    this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: 'Starting formatting products',
    });
    const parsedProductsList = [];

    const removeKeywords = (sentence: string, keywords: string[]): string => {
      let regex = new RegExp(keywords.join('|'), 'gi');
      return sentence.replace(regex, '').trim();
    };

    const capitalizeFirstLetter = (name: string): string => {
      const firstLetter = name.slice(0, 1);

      return `${firstLetter.toUpperCase()}${name.slice(1)}`;
    };

    const formattingParameters = (params: IWMProductParam[]) => {
      const createdParams = {};

      params.forEach((param) => {
        if (!toRemoveFromCharacteristics.includes(param.$.name)) {
          let formattedParam = '';
          if (param._.includes('|')) {
            formattedParam = param._.split('|').join(' | ');
          }
          createdParams[param.$.name] = formattedParam || param._;
        }
      });

      return createdParams;
    };

    const formattingDescription = (description: string) => {
      const root = parse(description, {
        blockTextElements: {
          style: false,
        },
      });

      const styleElements = root.querySelectorAll('[style]');
      styleElements.forEach((el) => el.removeAttribute('style'));

      const textContent = root.querySelectorAll('p');
      const recursiveRemoveSubString = (content: string, substring: string) => {
        const clearedString = content.replace(substring, '');
        if (clearedString.includes(substring)) {
          return recursiveRemoveSubString(clearedString, substring);
        } else {
          return clearedString;
        }
      };

      textContent.forEach((el) =>
        el.childNodes.forEach((e) => {
          if (e.textContent.includes('&deg;')) {
            e.textContent = recursiveRemoveSubString(e.textContent, '&deg;');
          }
          if (e.textContent.includes('&amp; deg;')) {
            e.textContent = recursiveRemoveSubString(
              e.textContent,
              '&amp; deg;',
            );
          }
          if (e.textContent.includes('& deg;')) {
            e.textContent = recursiveRemoveSubString(e.textContent, '& deg;');
          }
          if (e.textContent.length === 1 && e.textContent === '.') {
            e.textContent = '';
          }
        }),
      );

      return root.toString();
    };

    const createProductKey = (targetProduct: IProduct) => {
      if (targetProduct) {
        const substring = targetProduct.url.substring(
          `${this.root}shop/`.length,
        );

        if (substring.slice(substring.length - 1) === '/') {
          return substring.slice(0, -1);
        }
        return substring;
      }

      return null;
    };

    const formattedProduct = (product: IWMProduct): IWMFormattedProduct => {
      const nameWithoutBlockedWorld = removeKeywords(
        product.name[0],
        toRemoveFromName,
      );
      const formattedName = capitalizeFirstLetter(nameWithoutBlockedWorld);

      const targetProduct = allProductsFromSite.find(
        (p) => p.article === product.vendorCode[0],
      );

      return {
        name: formattedName,
        key: createProductKey(targetProduct),
        description: formattingDescription(product.description[0]),
        price: this.parsersHelperUtils.findPrice(Number(product.price[0])),
        availability: product.$.available
          ? JSON.parse(product.$.available)
          : false,
        shopKey: this.shopKey,
        categoryId: product.categoryId[0],
        files: product.picture,
        article: product.vendorCode[0],
        parameters: product.param?.length
          ? formattingParameters(product.param)
          : null,
      };
    };

    productsList.forEach((product: IWMProduct) => {
      const pr = formattedProduct(product);
      if (pr.key) {
        parsedProductsList.push(pr);
      }
    });

    return parsedProductsList;
  }

  public async createProductsInDB(
    productList: IWMFormattedProduct[],
    treeOfCategories: SimpleMap[],
    parserParams: IParserParams,
  ): Promise<number> {
    const processedProducts = {
      skippedByCategory: 0,
      parsedProduct: 0,
    };
    const totalParsedProducts = productList.length;

    await BlueBirdPromise.map(
      productList,
      async (product) => {
        const status = await this.checkParserStatus();

        if (status === EParserStatus.started) {
          await this.createProduct(
            product,
            treeOfCategories,
            processedProducts,
            parserParams,
          );
        } else {
          this.isStarted = false;
        }
      },
      { concurrency: 1 },
    );

    this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: `Processed ${processedProducts.parsedProduct} products out of ${totalParsedProducts} products. Skipped by category ${processedProducts.skippedByCategory}`,
    });

    return processedProducts.parsedProduct;
  }

  public async findRelatedCategory(
    treeOfCategories: SimpleMap[],
    categoryId: string,
  ) {
    const targetCategory = treeOfCategories.find((category: SimpleMap) => {
      let cat = null;
      if (category.shopKeys?.length) {
        cat = category.shopKeys.find((c) => c[this.shopKey] === categoryId);
      }

      return cat ? true : false;
    });

    if (targetCategory) {
      const relatedCategory = await this.subCategoryRepository.findOne({
        where: { key: targetCategory.key },
        relations: [
          'characteristicGroup',
          'characteristicGroup.characteristic',
        ],
      });

      return relatedCategory;
    }
    return null;
  }

  public async stopParsing() {
    this.isStarted = false;

    await this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: 'White Mandarin - parser is stopped by user',
    });
  }

  public async createProduct(
    product: IWMFormattedProduct,
    treeOfCategories: SimpleMap[],
    processedProducts,
    parserParams: IParserParams,
  ) {
    try {
      const isProductExist = await this.productsRepository.findOne({
        where: { key: product.key },
      });

      if (isProductExist && !parserParams.updateOldProducts) {
        return;
      }

      if (isProductExist && parserParams.updateOldProducts) {
        await this.clearedProduct(isProductExist.id);
      }

      let isDisabled: boolean = false;
      if (!product.availability) {
        isDisabled = true;
      }

      const newProduct: Partial<Product> = {
        ...(isProductExist?.id && { id: isProductExist.id }),
        name: this.parsersHelperUtils.clearNameFromUnicodeSymbols(product.name),
        key: product.key,
        description: product.description,
        price: product.price,
        availability: product.availability,
        shopKey: product.shopKey,
        disabled: isDisabled,
        nameInProvider: product.name,
      };

      const relatedCategory = await this.findRelatedCategory(
        treeOfCategories,
        product.categoryId,
      );

      if (!relatedCategory) {
        return (processedProducts.skippedByCategory += 1);
      }

      const url = await this.productService.generateProductUrl(relatedCategory);
      newProduct.url = url;
      newProduct.category = relatedCategory;

      const createdProduct = await this.productsRepository.save(newProduct);

      this.chatGateway.handleMessage({
        parser: this.shopKey,
        data: `Product: ${createdProduct.name} successfully created`,
      });

      const images = await this.imageUtilsService.imagesUploader(
        product.files,
        this.shopKey,
      );

      await this.productService.uploadMultipleImage(images, {
        productId: createdProduct.id,
      });

      await this.parsersHelperUtils.createCharacteristics(
        relatedCategory,
        createdProduct.id,
        product.parameters,
        this.productsRepository,
        this.categoryService,
        this.characteristicsValuesService,
      );

      return (processedProducts.parsedProduct += 1);
    } catch (error) {
      console.log(error);
    }
  }

  public async updateOneProduct(
    productsList: IWMFormattedProduct[],
    productKey: string,
    treeOfCategories: SimpleMap[],
    parserParams: IParserParams,
  ): Promise<number> {
    const processedProducts = {
      skippedByCategory: 0,
      parsedProduct: 0,
    };

    const targetProduct = productsList.find(
      (product) => product.key === productKey,
    );

    if (!targetProduct) {
      this.chatGateway.handleMessage({
        parser: this.shopKey,
        data: `Product with key ${productKey} not found`,
      });
      return processedProducts.parsedProduct;
    }

    await this.createProduct(
      targetProduct,
      treeOfCategories,
      processedProducts,
      parserParams,
    );

    this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: `Processed ${processedProducts.parsedProduct} product. Skipped by category ${processedProducts.skippedByCategory}`,
    });

    return processedProducts.parsedProduct;
  }

  public async clearedProduct(productId: number) {
    const targetProduct = await this.productsRepository.findOne({
      where: { id: productId },
      relations: ['files', 'characteristicValue'],
    });

    if (!targetProduct) {
      return this.chatGateway.handleMessage({
        parser: this.shopKey,
        data: 'Product not found',
      });
    }

    if (targetProduct.characteristicValue.length) {
      const characteristicValuesIds = [];

      targetProduct.characteristicValue.forEach((char) =>
        characteristicValuesIds.push(char.id),
      );

      await this.characteristicsValuesService.deleteCharacteristicValue({
        characteristicValuesIds,
      });
    }

    return this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: `${targetProduct.name} successfully cleared`,
    });
  }

  public async deleteAllProducts() {
    const products = await this.productsRepository
      .createQueryBuilder('product')
      .where('product.shopKey = :shopKey', { shopKey: this.shopKey })
      .leftJoinAndSelect('product.characteristicValue', 'charValue')
      .leftJoinAndSelect('product.files', 'files')
      .leftJoinAndSelect('product.category', 'category')
      .getMany();

    const productsToDelete = products.length;
    if (!productsToDelete) {
      return await this.chatGateway.stopMessage({
        parser: this.shopKey,
        command: 'Продукти для парсера White Mandarin не знайдено',
      });
    }

    await this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: `Starting delete ${productsToDelete} products`,
    });

    const categoriesForDeleteCharacteristicsId = [];
    products.forEach((product) => {
      if (!categoriesForDeleteCharacteristicsId.includes(product.category.id)) {
        categoriesForDeleteCharacteristicsId.push(product.category.id);
      }
    });

    const productIds = [];
    products.forEach((product) => productIds.push(product.id));
    const allProductsInOrders = await this.productToOrderRepository
      .createQueryBuilder('product_to_order')
      .leftJoinAndSelect('product_to_order.product', 'product')
      .leftJoinAndSelect('product_to_order.order', 'order')
      .where('product_to_order.product.id IN (:...productIds)', {
        productIds,
      })
      .getMany();

    if (allProductsInOrders.length) {
      await this.productToOrderRepository.remove(allProductsInOrders);
    }

    const fileNamesToDelete = [];
    const characteristicValuesIds: number[] = [];
    products.forEach((product) => {
      if (product.characteristicValue?.length) {
        product.characteristicValue.forEach((char) =>
          characteristicValuesIds.push(char.id),
        );
      }
      product.files.forEach((file) => {
        fileNamesToDelete.push(file.name);
      });
    });

    if (characteristicValuesIds.length) {
      await this.characteristicsValuesService.deleteCharacteristicValue({
        characteristicValuesIds,
      });
    }

    if (fileNamesToDelete.length && process.env.NODE_ENV === 'local') {
      await this.imageUtilsService.imageRemover(fileNamesToDelete);
    }

    if (fileNamesToDelete.length && process.env.NODE_ENV !== 'local') {
      await this.imageUtilsService.deleteFromStorage(fileNamesToDelete);
    }

    await this.productsRepository.remove(products);

    if (categoriesForDeleteCharacteristicsId.length) {
      await BlueBirdPromise.map(
        categoriesForDeleteCharacteristicsId,
        async (categoryId: number) => {
          await this.categoryService.deleteCategoryCharacteristics(categoryId);
        },
      );
    }

    await this.parsersHelperUtils.disableEmptyCategories();

    return this.chatGateway.stopMessage({
      parser: this.shopKey,
      command: `Successfully deleted: ${productsToDelete}`,
    });
  }
}
