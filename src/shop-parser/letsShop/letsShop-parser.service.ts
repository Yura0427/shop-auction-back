import { Inject, Injectable } from '@nestjs/common';
import { Repository, TreeRepository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import * as BlueBirdPromise from 'bluebird';
import { read, utils } from 'xlsx';

import { Product } from '../../product/product.entity';
import { Category } from '../../category/category.entity';
import {
  Categories,
  CheckedCategory,
  LetsShopProduct,
  SimpleMap,
} from '../parser';

import { ProductService } from '../../product/product.service';
import { ImageUtilsService } from '../../image/image-utils.service';
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
import * as fs from 'fs';
import { UpdateTreeCategoryDto } from '../../category/dto/updateTreeCategory.dto';
import { defaultCategories } from '../categiries-servise/tree-default-categories';
import { MistakesFixer } from './mistakesFixer';

export enum EParserStatus {
  started = 'STARTED',
  stopped = 'STOPPED',
}

@Injectable()
export class LetsShopParserService {
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
    @Inject('MistakesFixer')
    private MistakesFixer: MistakesFixer,
  ) {}

  public root = 'https://letsshop.com.ua/ua/tovary-dlya-dropshipperov/';
  public shopKey = 'letsShop';

  public async beginParsing(
    update: boolean = false,
    key: string = '',
  ): Promise<any> {
    try {
      //Change status in the DB if parser was started from the controller
      const allStatus = await this.parsersHelperUtils.getStatus();
      const currentStatus = allStatus.filter(
        (parser: { parserName: string }) => parser.parserName === this.shopKey,
      )[0].parserStatus;
      if (currentStatus === 'STOPPED') {
        this.chatGateway.saveStatusToDB({
          parser: this.shopKey,
          command: 'Start parsing from letsShop',
        });
      }
      await this.chatGateway.handleMessage({
        parser: this.shopKey,
        data: 'Start parsing from letsShop',
      });

      // for testing in localhost
      // const tempImgPath = `${process.env.IMG_TEMP}/LetsShopComUa_XLS_retail_and_purchase_prices2.xls`;
      // const file = await fs.promises.readFile(tempImgPath);
      // const workbook = read(file, { codepage: 1251 });

      const xls = await axios(
        'https://letsshop.com.ua/dropshipping1/LetsShopComUa_XLS_retail_and_purchase_prices.xls',
        { responseType: 'arraybuffer' },
      );
      const workbook = read(xls.data, { codepage: 1251 });

      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const parsedXls = utils.sheet_to_json(ws, { header: 'A' });
      const parsedProducts = this.xlsToProductList(parsedXls);

      await this.startParsing(parsedProducts, key);

      await this.chatGateway.stopMessage({
        parser: this.shopKey,
        command: '-=LetsShop parsing finished=-',
      });
      await this.parsersHelperUtils.disableEmptyCategories();
    } catch (e) {
      await this.chatGateway.handleMessage({
        parser: this.shopKey,
        data: `!!! New error: ${e.message} !!!`,
      });
    }
  }

  xlsToProductList(xls): Array<LetsShopProduct> {
    return xls.map((prod) => {
      return {
        productKey: prod['D'] && this.productKeyCleaner(prod['D']),
        category: prod['C'] ? prod['C'].replace(/\r?\n/g, ' ') : '',
        parentCategory: '',
        name: prod['F'] ? this.MistakesFixer.productNamesFixer(prod['F']) : '',
        nameWithKey: prod['F'] ? prod['F'] : '',
        nameWithKeyRu: prod['E'] ? prod['E'] : '',
        size: prod['G'] ? prod['G'] : '',
        producingCountry: prod['I'] ? prod['I'] : '',
        trademark: prod['J'] ? prod['J'] : '',
        type: prod['L'] ? prod['L'] : '',
        price:
          prod['O'] &&
          this.parsersHelperUtils.findPrice(Math.ceil(prod['O'] * 0.9)),
        quantity: prod['P'],
        images: prod['V'] ? prod['V'] : '',
        description: prod['Z'] ? prod['Z'] : '',
        characteristics: prod['S'] ? prod['S'] : '',
        article: this.setProductArticle(prod['S'] ? prod['S'] : ''),
        categoryFromDoc: prod['C'] ? prod['C'].replace(/\r?\n/g, ' ') : '',
      };
    });
  }

  async startParsing(parsedProducts: Array<LetsShopProduct>, key: string) {
    const params = await this.parametersRepository.findOne({
      name: ParametersNameEnum.parser,
    });
    const { updatePhoto, updateOldProducts } = params.settings[this.shopKey];
    await this.parsersHelperUtils.createMainCategories(defaultCategories, null);
    const simpleCategoriesMap = await this.parsersHelperUtils.buildEasyCategoryMap(
      treeCategories,
    );

    const letsShopCategories = await this.buildEasyCategoryMap(treeCategories);
    await this.parsersHelperUtils.createSubCategories(letsShopCategories);
    let productsList: LetsShopProduct[] = [];
    let colorList: string[] = [];

    try {
      const productsListNoSorted = await this.productsParser(
        simpleCategoriesMap,
        parsedProducts,
      );

      // Some products have different seasonality. We move them to the appropriate category
      const productsListSorted = productsListNoSorted.map((pr) => {
        if (pr.category === 'zhinochi-litni-sukni') {
          return this.sortedDressBySeason(pr);
        } else if (pr.category === 'shapky') {
          return this.sortingOfScarvesAndHats(pr);
        }
        return pr;
      });

      const uniqueProductArray = [];
      productsListSorted.filter((item) => {
        if (
          !uniqueProductArray.some(
            (element) => element.nameWithKey === item.nameWithKey,
          )
        ) {
          uniqueProductArray.push(item);
        }
      });

      // Deleting lost products
      const productsInDB = await this.productRepository.find({
        where: { shopKey: 'letsShop' },
      });
      const lostProducts = [];
      productsInDB.forEach((pr) => {
        const lostProduct = uniqueProductArray.filter(
          (prod) => prod.productKey == pr.key,
        );
        if (lostProduct.length > 0) return;
        lostProducts.push(pr);
      });

      if (lostProducts.length > 0) {
        await BlueBirdPromise.mapSeries(lostProducts, async (item) => {
          await this.productService.deleteProducts(item.id);
        });
      }

      // Search for unique products by name
      uniqueProductArray.forEach((pr) => {
        const findedProducts = productsListSorted.filter(
          (x) => x.nameWithKey === pr.nameWithKey,
        );
        if (
          findedProducts.length === 1 &&
          (key === '' || key === findedProducts[0].productKey)
        ) {
          productsList.push(pr);
        } else if (
          findedProducts &&
          (key === '' || key === findedProducts[0].productKey)
        ) {
          let newProduct: LetsShopProduct = findedProducts[0];
          let newDescription: [string] = [''];
          let colorsAndSizes = {};

          // Products that are repeated but in which different sizes and colors are grouped into one product
          findedProducts.forEach((pr) => {
            const description = pr.description;
            const characteristics = pr.characteristics;
            newDescription.push(pr.description);
            const size = pr.size
              ? pr.size
              : description.split(' ', 2).length > 1 &&
                description.split(' ', 2)[1].split('\n')[0];
            const color =
              characteristics.split('Колір: ').length > 1 &&
              characteristics.split('Колір: ')[1];

            // If the product does not have a color but has size, then instead of the color,
            // we use the service word 'common', which we work on at the front
            if (!color && size) {
              if (colorsAndSizes['common']) {
                colorsAndSizes['common'] = [...colorsAndSizes['common'], size];
              } else {
                colorsAndSizes['common'] = [size];
              }
            } else if (color && size) {
              if (color.split('\n')[0].split(', ').length > 1) {
                const fixedColor = this.MistakesFixer.colorNamesFixer(
                  color.split('\n')[0].split(', ')[0],
                );
                colorList.push(fixedColor);

                if (colorsAndSizes[`${fixedColor}`]) {
                  colorsAndSizes[`${fixedColor}`] = [
                    ...colorsAndSizes[`${fixedColor}`],
                    size,
                  ];
                } else {
                  colorsAndSizes[`${fixedColor}`] = [size];
                }
              } else {
                color
                  .split('\n')[0]
                  .split(', ')
                  .forEach(async (c) => {
                    const fixedColor = this.MistakesFixer.colorNamesFixer(c);
                    colorList.push(fixedColor);

                    if (colorsAndSizes[`${fixedColor}`]) {
                      colorsAndSizes[`${fixedColor}`] = [
                        ...colorsAndSizes[`${fixedColor}`],
                        size,
                      ];
                    } else {
                      colorsAndSizes[`${fixedColor}`] = [size];
                    }
                  });
              }
            }
          });

          newDescription.shift();
          newProduct.description = newDescription.join('\n');
          newProduct.colorsAndSizes = colorsAndSizes;
          productsList.push(newProduct);
        }
      });
    } catch (e) {
      if (e.message !== 'Abborted') {
        await this.chatGateway.handleMessage({
          parser: this.shopKey,
          data: e.message,
        });
      }
      throw new Error(e.message);
    }

    let currentItem = 1;
    await BlueBirdPromise.mapSeries(colorList, async (color) => {
      await this.colorsPicturesService.parseColorPicturesForLetsShop(color);
    });

    // We look for promotional products and change their price to a non-promotional one
    productsList = this.changePricesForPromotionProducts(productsList);

    await BlueBirdPromise.mapSeries(productsList, async (product) => {
      const parserSettings = await this.parserSettingsRepository.findOne({
        parserName: this.shopKey,
      });
      if (parserSettings.parserStatus !== EParserStatus.stopped) {
        await this.chatGateway.handleMessage({
          parser: this.shopKey,
          data:
            'Status: ' +
            currentItem +
            '/' +
            productsList.length +
            ' ' +
            product.nameWithKey,
        });
      }

      const isProductExist = await this.productRepository.findOne({
        where: { key: product.productKey },
        relations: ['files'],
      });

      const item = this.MistakesFixer.characteristicsGenderFixer(product);

      if (isProductExist?.disabled) {
        return;
      }

      currentItem++;

      if (!isProductExist) {
        try {
          const relatedCategory = await this.subCategoryRepository.findOne({
            where: { key: item.category },
            relations: [
              'characteristicGroup',
              'characteristicGroup.characteristic',
            ],
          });

          const productUrl = await this.productService.generateProductUrl(
            relatedCategory,
          );

          const product: Partial<Product> = {
            price: item.price,
            nameInProvider: item.nameWithKeyRu,
            key: item.productKey,
            url: productUrl,
            availability: true,
            category: relatedCategory,
            shopKey: this.shopKey,
            name: this.parsersHelperUtils.clearNameFromUnicodeSymbols(
              item.name,
            ),
          };

          product.description = item.description;

          const finalProduct = await this.productRepository.save(product);

          // Load images
          const imagesLinks = item.images.split('\n');
          const images = await this.imageUtilsService.imagesUploader(
            imagesLinks,
            this.shopKey,
          );
          await this.productService.uploadMultipleImage(images, {
            productId: finalProduct.id,
          });

          // Enable current category
          if (relatedCategory.disabled) {
            relatedCategory.disabled = false;
            await this.subCategoryRepository.save(relatedCategory);
          }

          // Enable parent category
          const parentCategory = await this.subCategoryRepository.findOne({
            where: { key: item.parentCategory },
          });
          if (parentCategory.disabled) {
            parentCategory.disabled = false;
            await this.subCategoryRepository.save(parentCategory);
          }

          const characteristicsOneArr = item.characteristics.split(/\r?\n/g);
          let characteristics: any = characteristicsOneArr.map((ch) => {
            return ch.split(': ');
          });

          item.colorsAndSizes &&
            characteristics.push(['Кольори та розміри', item.colorsAndSizes]);

          const relatedProduct = await this.productRepository.findOne(
            finalProduct.id,
            {
              relations: ['characteristicValue'],
            },
          );

          await this.parsedCharacteristics(
            relatedProduct,
            characteristics,
            relatedCategory,
            isProductExist,
          );
        } catch (e) {
          await this.chatGateway.handleMessage({
            parser: this.shopKey,
            data: `!!! New error: ${e.message} !!!`,
          });
        }

        // Update old products
      } else if (isProductExist && updateOldProducts) {
        try {
          const productInDB = await this.productRepository.findOne({
            where: { key: item.productKey },
            relations: ['files'],
          });

          const relatedCategory = await this.subCategoryRepository.findOne({
            where: { key: item.category },
            relations: [
              'characteristicGroup',
              'characteristicGroup.characteristic',
            ],
          });

          productInDB.price = item.price;
          productInDB.description = item.description;
          productInDB.name = item.name;
          productInDB.nameInProvider = item.nameWithKeyRu;

          await this.productRepository.save(productInDB);

          //# remove all product photos when "updatePhoto" param is true
          if (isProductExist.files.length && updatePhoto) {
            await BlueBirdPromise.mapSeries(productInDB.files, async (file) => {
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

          // Update old photo
          if (updatePhoto) {
            const imagesLinks = item.images.split('\n');
            const images = await this.imageUtilsService.imagesUploader(
              imagesLinks,
              this.shopKey,
            );
            await this.productService.uploadMultipleImage(images, {
              productId: productInDB.id,
            });
          }

          const characteristicsOneArr = item.characteristics.split(/\r?\n/g);
          let characteristics: any = characteristicsOneArr.map((ch) => {
            return ch.split(': ');
          });

          item.colorsAndSizes &&
            characteristics.push(['Кольори та розміри', item.colorsAndSizes]);

          if (isProductExist) {
            const product = await this.productRepository.findOne({
              where: { key: item.productKey },
              relations: ['characteristicValue'],
            });

            const charValuesIds = product.characteristicValue?.map((item) => {
              return item.id;
            });

            await this.characteristicsValuesService.deleteCharacteristicValue({
              characteristicValuesIds: charValuesIds,
            });
          }

          const relatedProduct = await this.productRepository.findOne(
            productInDB.id,
            {
              relations: ['characteristicValue'],
            },
          );

          await this.parsedCharacteristics(
            relatedProduct,
            characteristics,
            relatedCategory,
            isProductExist,
          );
        } catch (e) {
          await this.chatGateway.handleMessage({
            parser: this.shopKey,
            data: `!!! New error: ${e.message} !!!`,
          });
        }
      }
    });
  }

  async productsParser(
    simpleMap: SimpleMap[],
    parsedProducts: LetsShopProduct[],
  ): Promise<LetsShopProduct[]> {
    simpleMap = simpleMap.filter((category) => {
      const iterator = category.shopKeys.values();
      for (const key of iterator) {
        if (Object.keys(key)[0] === this.shopKey) {
          return true;
        }
      }
      return false;
    });

    let productsWithCheckedCategory: LetsShopProduct[] = [];
    //check all products and create full list
    try {
      await BlueBirdPromise.mapSeries(
        parsedProducts,
        async (parsed, index, arrayLength) => {
          simpleMap.forEach((category) => {
            if (category.shopKeys && category.shopKeys.length) {
              category.shopKeys.find((key) => {
                if (key[this.shopKey] === parsed.category) {
                  productsWithCheckedCategory.push({
                    productKey: parsed.productKey,
                    category: category.key,
                    parentCategory: category.parentKey,
                    name: parsed.name,
                    nameWithKey: parsed.nameWithKey,
                    nameWithKeyRu: parsed.nameWithKeyRu,
                    size: parsed.size,
                    producingCountry: parsed.producingCountry,
                    trademark: parsed.trademark,
                    type: parsed.type,
                    price: parsed.price,
                    quantity: parsed.quantity,
                    images: parsed.images,
                    description: parsed.description,
                    characteristics: parsed.characteristics,
                    colorsAndSizes:
                      parsed.colorsAndSizes && parsed.colorsAndSizes,
                    article: parsed.article,
                    xlsId: parsed.xlsId,
                    categoryFromDoc: parsed.categoryFromDoc,
                  });
                }
              });
            }
          });
        },
      );
    } catch (e) {
      await this.chatGateway.handleMessage({
        parser: this.shopKey,
        data: `!!! New error: ${e.message} !!!`,
      });
    }
    return productsWithCheckedCategory;
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
          if (key['letsShop']) return (isShopKeyExist = true);
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

  public sortedDressBySeason(product: LetsShopProduct) {
    const characteristicsOneArr = product.characteristics.split(/\r?\n/g);
    characteristicsOneArr.forEach((ch) => {
      if (ch.split(': ')[0] === 'Сезон') {
        const season = ch.split(': ')[1];
        if (
          season === 'Весна / Осінь' ||
          season === 'Весна / Осінь, Осінь /Зима' ||
          season === 'Осінь /Зима' ||
          season === 'Демісезон'
        ) {
          product.category = 'zhinochi-sukni-demisezonni';
        }
      }
    });
    return product;
  }

  public sortingOfScarvesAndHats(product: LetsShopProduct) {
    if (product.name.split(' ')[0] === 'Шарф') {
      product.category = 'sharfy';
    }
    return product;
  }

  public setProductArticle(characteristics: string) {
    const characteristicsOneArr = characteristics.split(/\r?\n/g);
    let article = 'null';
    characteristicsOneArr.forEach((ch) => {
      if (ch.split(': ')[0] === 'Артикул') {
        article = ch.split(': ')[1];
      }
    });
    return article;
  }

  public changePricesForPromotionProducts(
    listOfProducts: LetsShopProduct[],
  ): LetsShopProduct[] {
    let productsWithDifferentPrices = [];
    let articles = [];
    listOfProducts.forEach((pr) => {
      listOfProducts.forEach((prod) => {
        if (pr.article !== 'null') {
          if (
            pr.article === prod.article &&
            pr.productKey.substr(0, 3) === prod.productKey.substr(0, 3) &&
            pr.category === prod.category &&
            pr.name.substr(0, 8) === prod.name.substr(0, 8) &&
            pr.price !== prod.price &&
            pr.producingCountry === prod.producingCountry &&
            pr.trademark === prod.trademark &&
            this.characteristicsWithoutColor(pr.characteristics) ===
              this.characteristicsWithoutColor(prod.characteristics)
          ) {
            productsWithDifferentPrices.push(
              `${pr.article} ${pr.productKey} ${pr.price}`,
            );
            articles.push(`${pr.article}`);
          }
        }
      });
    });

    let uniqueProductsArray = productsWithDifferentPrices.filter(function (
      item,
      pos,
    ) {
      return productsWithDifferentPrices.indexOf(item) == pos;
    });

    let uniqueArticlesArray = articles.filter(function (item, pos) {
      return articles.indexOf(item) == pos;
    });

    const priceChanger = (products) => {
      let maxPrice = 0;
      products.forEach((pr) => {
        if (maxPrice < +pr.split(' ')[2]) {
          maxPrice = +pr.split(' ')[2];
        }
      });

      let changedProducts = [];
      products.forEach((pr) => {
        changedProducts.push({
          article: pr.split(' ')[0],
          productKey: pr.split(' ')[1],
          price: maxPrice,
        });
      });
      return changedProducts;
    };

    let productsWithChangedPrice = [];
    uniqueArticlesArray.forEach((article) => {
      let products = uniqueProductsArray.filter(
        (pr) => pr.split(' ')[0] === article,
      );
      if (products) {
        productsWithChangedPrice.push(...priceChanger(products));
      }
    });

    const products = listOfProducts.map((pr) => {
      const findedProduct = productsWithChangedPrice.find(
        (prod) => prod.productKey === pr.productKey,
      );
      if (findedProduct) {
        pr.price = findedProduct.price;
      }
      return pr;
    });

    return products;
  }

  public characteristicsWithoutColor(characteristics: string) {
    const characteristicsOneArr = characteristics.split(/\r?\n/g);
    let char = [];
    characteristicsOneArr.forEach((ch) => {
      if (ch.split(': ')[0] !== 'Колір') {
        char.push(ch.split(': ')[1]);
      }
    });
    return char.join('');
  }

  public async parsedCharacteristics(
    relatedProduct: Product,
    characteristics,
    relatedCategory,
    isProductExist,
  ) {
    try {
      let checkedCharacteristics = {};

      if (
        characteristics ||
        (characteristics && characteristics.length) ||
        relatedProduct.characteristicValue.length
      ) {
        const arrayOfCharracteristics = characteristics;
        for (let element of arrayOfCharracteristics) {
          const isExist = relatedProduct.characteristicValue.some(
            (obj) => obj.name === element[0] && obj,
          );
          if (!isExist) {
            checkedCharacteristics = {
              ...checkedCharacteristics,
              [element[0]]: element[1] ? element[1] : '',
            };
          }
        }
      }

      if (
        !checkedCharacteristics ||
        (checkedCharacteristics &&
          !Object.keys(checkedCharacteristics).length) ||
        (checkedCharacteristics &&
          Array.isArray(checkedCharacteristics) &&
          !checkedCharacteristics.length)
      ) {
        return;
      }

      const existedGroup =
        relatedCategory.characteristicGroup &&
        relatedCategory.characteristicGroup.length
          ? relatedCategory.characteristicGroup[0]
          : undefined;

      const existedChars =
        relatedCategory.characteristicGroup &&
        relatedCategory.characteristicGroup.length
          ? relatedCategory.characteristicGroup[0].characteristic
          : [];

      const chars = [];

      Object.entries(checkedCharacteristics).forEach((char) => {
        const charName = char[0];
        const charValue = char[1];
        const charFound = existedChars.length
          ? existedChars.find(
              (existedChar) =>
                existedChar.name.toLowerCase() === charName.toLowerCase(),
            )
          : false;
        if (charFound) {
          return;
        }

        const typeDetector = (c) => {
          if (typeof c === 'string') {
            return 'string';
          }
          if (typeof c === 'object') {
            return 'json';
          }
        };

        const type = typeDetector(charValue);

        chars.push({
          name: charName,
          description: charName,
          required: false,
          type,
          categoryId: relatedCategory.id,
        });
      });

      let updatedCategory = relatedCategory;

      if (chars.length) {
        const categoryToUpdate = {
          id: relatedCategory.id,
        };

        if (existedGroup) {
          categoryToUpdate['characteristicGroups'] = [
            {
              id: existedGroup.id,
              characteristics: chars,
            },
          ];
        }

        if (!existedGroup) {
          categoryToUpdate['characteristicGroups'] = [
            {
              name: 'Основні характеристики',
              characteristics: chars,
            },
          ];
        }

        updatedCategory = await this.categoryService.updateTreeCategory(
          categoryToUpdate as UpdateTreeCategoryDto,
        );
      }

      const createdChars =
        updatedCategory.characteristicGroup[0].characteristic;
      const charsValues: any[] = [];

      Object.entries(checkedCharacteristics).forEach((char) => {
        const charName = char[0];
        const charValue = char[1];

        const foundChar = createdChars.find(
          (createdChar) =>
            createdChar.name.toLowerCase() === charName.toLowerCase(),
        );

        if (!foundChar) {
          return;
        }

        const newChar = {
          name: foundChar.name,
          characteristicId: foundChar.id,
        };

        if (foundChar.type === 'string') {
          newChar['stringValue'] = charValue;
        }

        if (foundChar.type === 'json') {
          newChar['jsonValue'] = charValue;
        }

        if (foundChar.type === 'boolean' && typeof charValue === 'string') {
          newChar['booleanValue'] = charValue.toLowerCase() === 'да';
        }

        charsValues.push(newChar);
      });

      const charValuesToCreate = {
        productId: relatedProduct.id,
        characteristicValues: charsValues,
        noValidate: true,
      };

      await this.characteristicsValuesService.createCharacteristicValue(
        charValuesToCreate,
      );
    } catch (e) {
      await this.chatGateway.handleMessage({
        parser: this.shopKey,
        data: `!!! New error: ${e.message} !!!`,
      });
    }
  }

  public productKeyCleaner(productKey: string): string {
    let newWordsArray = [];
    const codeAlphabet = {
      1040: 'A',
      1041: 'B',
      1042: 'V',
      1043: 'G',
      1044: 'D',
      1045: 'E',
      1046: 'G',
      1047: 'Z',
      1048: 'I',
      1049: 'I',
      1050: 'K',
      1051: 'L',
      1052: 'M',
      1053: 'N',
      1054: 'O',
      1055: 'P',
      1056: 'R',
      1057: 'S',
      1058: 'T',
      1059: 'U',
      1060: 'F',
      1061: 'H',
      1062: 'C',
      1063: 'C',
      1064: 'H',
      1065: 'H',
      1066: 'I',
      1067: 'I',
      1068: 'I',
      1069: 'E',
      1070: 'Y',
      1071: 'Y',
    };

    const wordTranslater = (symbol) => {
      if (symbol.charCodeAt(0) >= 1040 && symbol.charCodeAt(0) <= 1103) {
        const symbolCode = symbol.toUpperCase().charCodeAt(0);
        return codeAlphabet[`${symbolCode}`];
      } else return symbol;
    };

    const wordsArray = productKey
      .split(' ')[0]
      .replace(/[\.\/]/g, '-')
      .replace('см', '')
      .split('');
    wordsArray.forEach((word) => {
      newWordsArray.push(wordTranslater(word));
    });
    return newWordsArray.join('');
  }
}
