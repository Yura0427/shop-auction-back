import { Inject, Injectable } from '@nestjs/common';
import { Repository, TreeRepository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { parse, HTMLElement } from 'node-html-parser';
import * as BlueBirdPromise from 'bluebird';
import { Product } from '../../product/product.entity';
import { Category } from '../../category/category.entity';
import {
  BaseCategory,
  Categories,
  CheckedCategory,
  ProductsUrl,
  SimpleMap,
} from '../parser';
import { ProductService } from '../../product/product.service';
import { ImageUtilsService } from '../../image/image-utils.service';
import { IResponseMessage } from '../../interfaces/response-message.interface';
import { FilesService } from '../../files/files.service';
import { treeCategories } from '../categiries-servise/tree-categories-keys';
import { ParametersNameEnum } from '../../parameters/parameters.enum';
import { Parameters } from '../../parameters/parameters.entity';
import { CharacteristicsValuesService } from 'src/characteristics-values/characteristics-values.service';
import { CategoryService } from '../../category/categories.service';
import { ParsersHelperUtils } from '../utils/parserHelper.utils';
import { ParserSettings } from '../parserSettings.entity';
import { ChatGateway } from '../../socket/socket-console.gateway';
import { ColorsPicturesService } from '../../colors-pictures/colors-pictures.service';
import { defaultCategories } from '../categiries-servise/tree-default-categories';
import { EParserStatus } from '../utils/parserStatus.enum';
import pobedovColorTranslator from 'src/utils/pobedovColorTranslator';
import puppeteer, { PageEmittedEvents } from 'puppeteer';

export enum EPobedovSortingFilter {
  'Исходная сортировка' = '?swoof=1&orderby=menu_order&really_curr_tax=29-product_cat',
  'По популярности' = '?swoof=1&orderby=popularity&really_curr_tax=29-product_cat',
  'По рейтингу' = '?swoof=1&orderby=rating&really_curr_tax=29-product_cat',
  'Сортировка по более позднему' = '?swoof=1&orderby=date&really_curr_tax=29-product_cat',
  'Цены: по возрастанию' = '?swoof=1&orderby=price&really_curr_tax=29-product_cat',
  'Цены: по убыванию' = '?swoof=1&orderby=price-desc&really_curr_tax=29-product_cat',
}

@Injectable()
export class PobedovParserService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Parameters)
    private parametersRepository: Repository<Parameters>,
    @InjectRepository(ParserSettings)
    private parserSettingsRepository: Repository<ParserSettings>,
    @InjectRepository(Category)
    private subCategoryRepository: TreeRepository<Category>,
    @Inject('ProductService')
    private productService: ProductService,
    @Inject('ImageUtilsService')
    private imageUtilsService: ImageUtilsService,
    @Inject('FilesService')
    private fileService: FilesService,
    @Inject('CharacteristicsValuesService')
    private characteristicsValuesService: CharacteristicsValuesService,
    @Inject('CategoryService')
    private categoryService: CategoryService,
    @Inject('ParsersHelperUtils')
    private parsersHelperUtils: ParsersHelperUtils,
    @Inject('ChatGateway')
    private chatGateway: ChatGateway,
    @Inject('ColorsPicturesService')
    private colorsPicturesService: ColorsPicturesService,
  ) {}

  public root = 'https://pobedov.com/';
  public shopKey = 'pobedov';
  public shopFilter = EPobedovSortingFilter['По популярности'];

  public async beginParsing(
    update: boolean = false,
    key: string = '',
  ): Promise<IResponseMessage> {
    //Change status in the DB if parser was started from the controller
    const allStatus = await this.parsersHelperUtils.getStatus();
    const currentStatus = allStatus.filter(
      (parser: { parserName: string }) => parser.parserName === this.shopKey,
    )[0].parserStatus;
    if (currentStatus === 'STOPPED') {
      this.chatGateway.saveStatusToDB({
        parser: this.shopKey,
        command: 'Start parsing from POBEDOV',
      });
    }

    await this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: 'Start parsing from POBEDOV',
    });

    await this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: `Filter: "${
        Object.keys(EPobedovSortingFilter)[
          Object.values(EPobedovSortingFilter).indexOf(this.shopFilter)
        ]
      }"`,
    });

    let productsList: ProductsUrl[];

    if (!update) {
      //read main page
      let root: HTMLElement;
      try {
        const result = await axios.get(this.root);
        root = parse(result.data);
      } catch (e) {
        await this.chatGateway.stopMessage({
          parser: this.shopKey,
          command: 'Can`t read main page. ' + e.message,
        });
        return { message: 'Can`t read main page. ' + e };
      }

      //category parsing
      try {
        productsList = await this.categoryParser();
      } catch (e) {
        if (e.message !== 'Abborted') {
          await this.chatGateway.stopMessage({
            parser: this.shopKey,
            command: 'Can`t create products list ' + e.message,
          });
          return { message: 'Can`t create products list. ' + e };
        }
        await this.chatGateway.stopMessage({
          parser: this.shopKey,
          command: 'Parsing was STOPPED...',
        });
        return { message: 'Parsing was STOPPED... ' };
      }
    } else {
      //get all products from database
      let allParsedProducts: Product[] = [];

      if (!key) {
        allParsedProducts = await this.productRepository.find({
          where: { shopKey: this.shopKey },
          relations: ['category'],
        });
      } else {
        allParsedProducts = await this.productRepository.find({
          where: { key: key },
          relations: ['category', 'files'],
        });

        //check filenames before update
        const filesArray = allParsedProducts[0]?.files.map(
          (element) => element.name,
        );
        await this.chatGateway.handleMessage({
          parser: this.shopKey,
          data:
            '<== files before update \n' + filesArray?.join(' \n') + '\n==>',
        });
      }

      productsList = allParsedProducts.map((element) => {
        return {
          url: this.root + 'product/' + element.key + '/',
          keyOfCategory: element.category.key,
        };
      });
    }

    productsList = productsList.filter(
      (value, index, self) =>
        index === self.findIndex((t) => t.url === value.url),
    );

    // for update add productsList here
    const parserSettings = await this.parserSettingsRepository.findOne({
      parserName: this.shopKey,
    });
    if (parserSettings.parserStatus !== EParserStatus.stopped) {
      await this.chatGateway.handleMessage({
        parser: this.shopKey,
        data: 'Total items: ' + productsList.length,
      });
    }

    const params = await this.parametersRepository.findOne({
      name: ParametersNameEnum.parser,
    });
    const { updatePhoto, updateOldCharacteristics } = params.settings[
      this.shopKey
    ];

    let currentProduct = 1;

    try {
      await BlueBirdPromise.mapSeries(productsList, async (product) => {
        const parserSettings = await this.parserSettingsRepository.findOne({
          parserName: this.shopKey,
        });
        if (parserSettings.parserStatus !== EParserStatus.stopped) {
          await this.parseProduct(
            {
              url: product.url,
              keyOfCategory: product.keyOfCategory,
              keyOfParentCategory: product.keyOfParentCategory,
            },
            updatePhoto,
            productsList.length,
            currentProduct,
            updateOldCharacteristics,
          );
          currentProduct++;
        }
      });
    } catch (e) {
      await this.chatGateway.stopMessage({
        parser: this.shopKey,
        command: `!!! New error: ${e.message} !!!`,
      });
      return { message: `!!! New error: ${e.message} !!!` };
    }

    await this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: 'The process finished...',
    });

    await this.parsersHelperUtils.disableEmptyCategories();

    await this.chatGateway.stopMessage({
      parser: this.shopKey,
      command: '-=POBEDOV parsing finished=-',
    });

    //check filenames after update
    if (key) {
      const allParsedProducts = await this.productRepository.find({
        where: { key: key },
        relations: ['category', 'files'],
      });
      const filesArray = allParsedProducts[0]?.files.map(
        (element) => element.name,
      );
      await this.chatGateway.handleMessage({
        parser: this.shopKey,
        data: '<== files after update \n' + filesArray?.join(' \n') + '\n==>',
      });
    }
    return { message: 'POBEDOV parsing finished' };
  }

  async categoryParser(): Promise<ProductsUrl[]> {
    //get menu list
    const categoriesUrl = `${this.root}categories/`;
    const result = await axios.get(categoriesUrl);
    const categoriesDOM = parse(result.data);
    const categorySelector = '.products > li.product-category';
    const categoriesList = categoriesDOM.querySelectorAll(categorySelector);

    const categoryBuilder = (category): BaseCategory => {
      const categoryURL: string = category
        .querySelector('a')
        .getAttribute('href');
      const categoryAnchor: string = category.querySelector('a').textContent;

      return {
        key: categoryURL,
        name: categoryAnchor,
        description: categoryAnchor,
      };
    };

    // #map parsed category into one-level array
    const topLevelList = [];
    for (const category of categoriesList) {
      const mappedCategory = categoryBuilder(category);
      topLevelList.push(mappedCategory);
    }

    await this.parsersHelperUtils.createMainCategories(defaultCategories, null);

    const simpleCategoriesMap = await this.parsersHelperUtils.buildEasyCategoryMap(
      treeCategories,
    );

    const pobedovShopCategories = await this.buildEasyCategoryMap(
      treeCategories,
    );

    await this.parsersHelperUtils.createSubCategories(pobedovShopCategories);

    let productsList: ProductsUrl[];
    try {
      productsList = await this.productsParser(
        simpleCategoriesMap,
        topLevelList,
      );
    } catch (e) {
      if (e.message !== 'Abborted') {
        await this.chatGateway.handleMessage({
          parser: this.shopKey,
          data: e.message,
        });
      }
      throw new Error(e.message);
    }

    return productsList;
  }

  async getCategoryUrlsWithPagination(
    relatedCategoryInfo,
  ): Promise<ProductsUrl[]> {
    let productsDOM: HTMLElement = null;
    const { url, keyOfCategory, keyOfParentCategory } = relatedCategoryInfo;
    const listUrl: ProductsUrl[] = [];

    await this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: `Working with category: ${url} in "${keyOfCategory}"`,
    });

    const result = await axios.get(`${url}`);
    productsDOM = parse(result.data);
    const categorySelector = '.product-categories > li';
    const categoriesList = productsDOM.querySelectorAll(categorySelector);

    // #map parsed category into one-level array
    const topLevelList: HTMLElement[] = [];

    await BlueBirdPromise.mapSeries(categoriesList, (category: HTMLElement) => {
      topLevelList.push(category);
    });

    const relatedCategory = topLevelList.find((category) => {
      return category.querySelector('a') !== null;
    });

    if (!!!relatedCategory) {
      await this.chatGateway.stopMessage({
        parser: this.shopKey,
        command: 'Can`t find the category in the sidebar',
      });
      throw new Error('Can`t find the category in the sidebar');
    }

    const paginator = productsDOM.querySelectorAll('ul.page-numbers > li > a');

    let lastPageNumber = 1;
    if (paginator.length) {
      lastPageNumber = paginator.length;
    }

    if (process.env.NODE_ENV === 'local') {
      lastPageNumber = Math.ceil(lastPageNumber * 0.35);
    }

    const pagedUrls: string[] = [];

    for (let i = 1; i <= lastPageNumber; i++) {
      i === 1
        ? pagedUrls.push(`${url}${this.shopFilter}`)
        : pagedUrls.push(`${url}page/${i}/${this.shopFilter}`);
    }

    const pagedList = pagedUrls.map((item) => {
      return {
        url: item,
        keyOfCategory,
        keyOfParentCategory,
      };
    });
    listUrl.push(...pagedList);

    return listUrl;
  }

  async getProductList(pagedCategory: ProductsUrl): Promise<string[]> {
    let categoryDOM: HTMLElement = null;

    const result = await axios.get(`${pagedCategory.url}`);
    categoryDOM = parse(result.data);

    const products = categoryDOM
      .querySelectorAll('a')
      .filter(
        (a) => 'class' in a.attributes && a.attributes.class === 'product-name',
      );

    if (!products) {
      await this.chatGateway.stopMessage({
        parser: this.shopKey,
        command: 'Can`t find link for the product',
      });
      throw new Error('Can`t find link for the product');
    }

    return products.map((product) => product.getAttribute('href'));
  }

  async parseProduct(
    productInfo: ProductsUrl,
    updatePhoto: boolean,
    totalProducts: number,
    currentProduct: number,
    updateOldCharacteristics: boolean,
  ): Promise<any> {
    let productDOM: HTMLElement = null;
    let productKey = productInfo.url
      .slice(this.root.length)
      .replace('product/', '')
      .replace('/', '');

    const isProductExist = await this.productRepository.findOne({
      where: { key: productKey },
      relations: ['files'],
    });

    if (isProductExist?.disabled) {
      return;
    }

    let isPageExist = true;

    let name = null;

    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.setRequestInterception(true);
      page.on(PageEmittedEvents.Request, (req) => {
        if (
          !['document', 'xhr', 'fetch', 'script'].includes(req.resourceType())
        ) {
          return req.abort();
        }
        req.continue();
      });

      await page.goto(productInfo.url);

      const html = await page.content();

      await browser.close();

      productDOM = parse(html);

      name = productDOM?.querySelector('h1.product_title');

      this.colorsPicturesService.parseColorPicturesForPobedov(productDOM);
    } catch (e) {
      if (e.response && e.response.status === 404) {
        isPageExist = false;
      }
    }

    await this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: `${currentProduct}/${totalProducts} Product: ${productInfo.url}`,
    });

    // delete product if it has finished on the site
    if (!isPageExist) {
      const forDelete = await this.productRepository.findOne({
        where: { key: productKey },
        relations: ['files'],
      });
      await this.productService.deleteProducts(forDelete.id);
      await this.chatGateway.handleMessage({
        parser: this.shopKey,
        data: 'Product have deleted from database',
      });
      return;
    }

    //Image list parsing
    const imagesList = productDOM?.querySelectorAll('[data-fancybox="images"]');

    if (!imagesList.length) {
      return;
    }

    //IsAvailable parsing
    const isAvailable = !productDOM.querySelector(
      '[class="stock out-of-stock"]',
    );

    //Price parsing
    const priceNode = productDOM?.querySelector('p.price[data-price]');

    const discountedPriceNode = productDOM?.querySelector(
      'p.price[data-price] del > span',
    );

    if (!priceNode.attributes['data-price']) {
      return;
    }
    const discountedPrice = discountedPriceNode?.textContent
      ? parseInt(discountedPriceNode.textContent.replace(/[^\d.-]/g, ''))
      : null;

    let price = discountedPrice
      ? this.parsersHelperUtils.findPrice(discountedPrice)
      : this.parsersHelperUtils.findPrice(
          parseInt(priceNode.getAttribute('data-price')),
        );

    const availableSizesNodes = productDOM
      ?.querySelectorAll('li[data-wvstooltip]')
      .filter((el) => !el.getAttribute('class').includes('disabled'));

    const availableSizes = availableSizesNodes.map((el) =>
      el.getAttribute('data-value').toUpperCase(),
    );

    availableSizes.sort();

    const colorNode = productDOM.querySelector(
      '.iconic-wlv-terms__term--current',
    );

    const currentColorFromSite = colorNode
      ? colorNode.getAttribute('data-iconic-wlv-term-label')
      : undefined;

    let currentColor = 'common';

    if (currentColorFromSite) {
      currentColor = currentColorFromSite;
    }

    if (currentColor !== 'common') {
      currentColor = pobedovColorTranslator(currentColor);
    }

    if (!name || !price) {
      await this.chatGateway.stopMessage({
        parser: this.shopKey,
        command: `Can't find price or H1 of the product ${productInfo.url}`,
      });
      throw new Error(
        `Can't find price or H1 of the product ${productInfo.url}`,
      );
    }

    let description = productDOM.querySelector('#tab-description > p')
      .textContent;
    description = description ? `<p>${description}</p>` : null;

    let characteristics = {};

    if (currentColor && availableSizes.length) {
      characteristics = {
        'Кольори та розміри': { [currentColor]: [...new Set(availableSizes)] },
      };
    }

    //Product parsing
    const relatedCategory = await this.subCategoryRepository.findOne({
      where: { key: productInfo.keyOfCategory },
      relations: ['characteristicGroup', 'characteristicGroup.characteristic'],
    });

    // Enable current category
    if (relatedCategory.disabled) {
      relatedCategory.disabled = false;
      await this.subCategoryRepository.save(relatedCategory);
    }

    // Enable parent category
    const parentCategory = await this.subCategoryRepository.findOne({
      where: { key: productInfo.keyOfParentCategory },
    });
    if (parentCategory.disabled) {
      parentCategory.disabled = false;
      await this.subCategoryRepository.save(parentCategory);
    }

    const url = await this.productService.generateProductUrl(relatedCategory);

    const product: Partial<Product> = {
      price: Math.floor(price),
      key: productKey,
      url,
      availability: true,
      category: relatedCategory,
      shopKey: this.shopKey,
      name: this.parsersHelperUtils.clearNameFromUnicodeSymbols(
        name.textContent.replace(/\s\s+/g, ' '),
      ),
    };

    if (!isProductExist) {
      product.description = description;
    }

    if (!isAvailable && isProductExist) {
      await this.productRepository.update(isProductExist.id, {
        availability: false,
      });
      return;
    }

    if (!isProductExist && !isAvailable) {
      return;
    }

    let finalProduct = null;

    if (isAvailable && isProductExist) {
      await this.productRepository.save({ id: isProductExist.id, ...product });
      finalProduct = isProductExist;

      if (isProductExist.files?.length && !updatePhoto) {
        if (updateOldCharacteristics) {
          await this.parsersHelperUtils.createCharacteristics(
            relatedCategory,
            finalProduct.id,
            characteristics,
            this.productRepository,
            this.categoryService,
            this.characteristicsValuesService,
          );
        }
        return;
      }

      //# remove all product photos when "updatePhoto" param is true
      if (isProductExist.files?.length) {
        await BlueBirdPromise.mapSeries(isProductExist.files, async (file) => {
          try {
            await this.fileService.deleteImage(file.name);
          } catch (e) {
            await this.chatGateway.handleMessage({
              parser: this.shopKey,
              data: 'Can`t delete old images. ' + e.message,
            });
          }
        });
      }
    } else {
      finalProduct = await this.productRepository.save(product);
    }

    const imageLinks = await BlueBirdPromise.map(
      imagesList,
      (image: HTMLElement) => image.getAttribute('href'),
    );

    const images = await this.imageUtilsService.imagesUploader(
      imageLinks,
      this.shopKey,
    );
    await this.productService.uploadMultipleImage(images, {
      productId: finalProduct.id,
    });

    await this.parsersHelperUtils.createCharacteristics(
      relatedCategory,
      finalProduct.id,
      characteristics,
      this.productRepository,
      this.categoryService,
      this.characteristicsValuesService,
    );
  }

  async productsParser(
    simpleMap: SimpleMap[],
    parsedCategories: BaseCategory[],
  ): Promise<ProductsUrl[]> {
    const params = await this.parametersRepository.findOne({
      name: ParametersNameEnum.parser,
    });

    const {
      createNewProducts,
      updateOldProducts,
      parserLimit,
    } = params.settings[this.shopKey];
    const pagedCategories: ProductsUrl[] = [];

    //clear simpleMap from wrong products
    simpleMap = simpleMap.filter((category) => {
      const iterator = category.shopKeys.values();
      for (const key of iterator) {
        if (Object.keys(key)[0] === this.shopKey) {
          return true;
        }
      }
      return false;
    });

    //check all products and create full list
    await BlueBirdPromise.mapSeries(
      parsedCategories,
      async (parsed, index, arrayLength) => {
        let relatedCategoryInfo = null;

        if (simpleMap.length > 0) {
          simpleMap.forEach((category) => {
            if (category.shopKeys && category.shopKeys.length) {
              category.shopKeys.find((key) => {
                if (key[this.shopKey] === parsed.key) {
                  relatedCategoryInfo = {
                    keyOfCategory: category.key,
                    url: key[this.shopKey],
                    keyOfParentCategory: category.parentKey,
                  };
                }
              });
            }
          });
        }

        if (relatedCategoryInfo) {
          try {
            const parserSettings = await this.parserSettingsRepository.findOne({
              parserName: this.shopKey,
            });
            if (parserSettings.parserStatus !== EParserStatus.stopped) {
              const pagedList = await this.getCategoryUrlsWithPagination(
                relatedCategoryInfo,
              );
              pagedCategories.push(...pagedList);
            } else {
              await this.chatGateway.handleMessage({
                parser: this.shopKey,
                data: 'Abborted',
              });
              throw Error('Abborted');
            }
          } catch (e) {
            if (e.message !== 'Abborted') {
              await this.chatGateway.handleMessage({
                parser: this.shopKey,
                data: 'Can`t create pagination list. ' + e.message,
              });
            }
            throw Error('Abborted');
          }
        }

        if (arrayLength === index + 1) {
          await this.chatGateway.handleMessage({
            parser: this.shopKey,
            data: 'Wait for the categories to finish processing...',
          });
        }
      },
    );

    const productsList = [];
    await BlueBirdPromise.mapSeries(pagedCategories, async (pagedCategory) => {
      const currentList = await this.getProductList(pagedCategory);

      const currentListFiltered = await BlueBirdPromise.filter(
        currentList,
        async (item) => {
          let productKey = item
            .slice(this.root.length)
            .replace('product/', '')
            .replace('/', '');

          const isProductExist = await this.productRepository.findOne({
            where: { key: productKey },
            relations: ['files'],
          });
          if (!updateOldProducts && !!isProductExist) {
            return false;
          }
          if (!createNewProducts && !isProductExist) {
            return false;
          }
          return true;
        },
      );

      const mappedList = currentListFiltered.map((item) => ({
        url: item,
        keyOfCategory: pagedCategory.keyOfCategory,
        keyOfParentCategory: pagedCategory.keyOfParentCategory,
      }));

      productsList.push(...mappedList);
    });

    return productsList;
  }

  async getCsvFile() {
    try {
      const { data } = await axios.get(
        'https://pobedov.com/wp-content/plugins/ak-csv-export/export/73822.csv',
        {
          responseType: 'arraybuffer',
        },
      );
      return data;
    } catch (e) {
      await this.chatGateway.stopMessage({
        parser: this.shopKey,
        command: `!!! New error: ${e.message} !!!`,
      });
      return { message: `!!! New error: ${e.message} !!!` };
    }
  }

  public async buildEasyCategoryMap(
    treeCategories: Categories[],
  ): Promise<CheckedCategory[]> {
    const categories: CheckedCategory[] = [];

    (function buildRecursive(
      treeCategories: Categories[],
      keyOfParent?: string,
    ) {
      for (const category of treeCategories) {
        const { subCategories, ...baseFields } = category;

        const parentKey = keyOfParent ? keyOfParent : null;
        let isShopKeyExist = false;

        category.shopKeys?.forEach((key) => {
          if (key['pobedov']) return (isShopKeyExist = true);
        });

        if (!subCategories.length && isShopKeyExist) {
          categories.push({
            key: category.key,
            name: category.name,
            description: category.name,
            parentKey: parentKey,
          });
        } else {
          buildRecursive(subCategories, baseFields.key);
        }
      }
    })(treeCategories, null);

    return categories;
  }
}
