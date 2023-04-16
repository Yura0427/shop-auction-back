import { Inject, Injectable } from '@nestjs/common';
import { Repository, TreeRepository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { parse, HTMLElement, TextNode } from 'node-html-parser';
import * as BlueBirdPromise from 'bluebird';

import { Product } from '../../product/product.entity';
import { Category } from '../../category/category.entity';
import { BaseCategory, ParserSpec, ProductsUrl, SimpleMap } from '../parser';

import { ProductService } from '../../product/product.service';
import { ImageUtilsService } from '../../image/image-utils.service';
import { IResponseMessage } from '../../interfaces/response-message.interface';
import { FilesService } from '../../files/files.service';
import { treeCategories } from '../categiries-servise/tree-categories-keys';
import { ParametersNameEnum } from '../../parameters/parameters.enum';
import { Parameters } from '../../parameters/parameters.entity';
import { CharacteristicsValuesService } from 'src/characteristics-values/characteristics-values.service';
import { CategoryService } from '../../category/categories.service';
import { ColorsPicturesService } from '../../colors-pictures/colors-pictures.service';
import { ParsersHelperUtils } from '../utils/parserHelper.utils';
import { ParserSettings } from '../parserSettings.entity';
import { EParserStatus } from '../utils/parserStatus.enum';
import * as retry from 'bluebird-retry';
import { ChatGateway } from 'src/socket/socket-console.gateway';
import { ColorsSource } from '../../colors-pictures/colors-source.enum';

@Injectable()
export class ShopParserService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Parameters)
    private parametersRepository: Repository<Parameters>,
    @InjectRepository(Category)
    private subCategoryRepository: TreeRepository<Category>,
    @InjectRepository(ParserSettings)
    private parserSettingsRepository: Repository<ParserSettings>,
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
    @Inject('ColorsPicturesService')
    private colorsPicturesService: ColorsPicturesService,
    @Inject('ParsersHelperUtils')
    private parsersHelperUtils: ParsersHelperUtils,
    @Inject('ChatGateway')
    private chatGateway: ChatGateway,
  ) {}

  public root = 'https://fashion-girl.ua/ua/';
  public shopKey = 'fashionGirl';

  public async fashionGirlParcer(
    update: boolean = false,
    key: string = '',
  ): Promise<IResponseMessage> {
    //Change status in the DB if parser was started from the controller
    const allStatus = await this.parsersHelperUtils.getStatus();
    const currentStatus = allStatus.filter(
      (parser) => parser.parserName === this.shopKey,
    )[0].parserStatus;
    if (currentStatus === 'STOPPED') {
      this.chatGateway.saveStatusToDB({
        parser: this.shopKey,
        command: 'Start parsing from Fashion Girl',
      });
    }

    await this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: 'Start parsing from Fashion Girl',
    });

    let productsList: ProductsUrl[] = null;

    if (!update) {
      //read main page
      while (true) {
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
        const logoSelector = '.b-header-company-name__logo';
        const logoLink = root.querySelector(logoSelector);
        const logoHref = logoLink.getAttribute('href');

        if (logoHref === 'https://fashion-girl.ua/ua/') {
          try {
            productsList = await this.categoryParser(root);
            break;
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
        }
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
          url: '/ua/' + element.key + '.html',
          keyOfCategory: element.category.key,
        };
      });
    }

    //for update add productsList here
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
      command: '-=FashionGirl parsing finished=-',
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
    return { message: 'FashionGirl parsing finished' };
  }

  async categoryParser(rootDOM: HTMLElement): Promise<ProductsUrl[]> {
    //get menu list
    const catalogSelector = '.b-sidebar .b-nav__item-inner .b-nav__list > li';
    const categoriesList = rootDOM.querySelectorAll(catalogSelector);

    const categoryBuilder = (category): BaseCategory => {
      const categoryURL = category.querySelector('a').getAttribute('href');
      const categoryAnchor = category.querySelector('a').textContent;

      return {
        key: categoryURL,
        name: categoryAnchor,
        description: categoryAnchor,
      };
    };

    // #map parsed category into one-level array
    const topLevelList = [];
    for (const category of categoriesList) {
      const hasSubCategory = category.querySelector('ul');
      let subLevelList: BaseCategory[] = [];

      if (hasSubCategory) {
        const subCategories = hasSubCategory.querySelectorAll('li');
        subLevelList = subCategories.map((subCategory) => {
          return categoryBuilder(subCategory);
        });
      }

      const mappedCategory = categoryBuilder(category);
      topLevelList.push(mappedCategory);
      if (subLevelList.length) topLevelList.push(...subLevelList);
    }

    await this.parsersHelperUtils.createParsedCategories(
      topLevelList,
      this.shopKey,
    );

    const simpleCategoriesMap = await this.parsersHelperUtils.buildEasyCategoryMap(
      treeCategories,
    );

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
    url: string,
    keyOfCategory: string,
  ): Promise<ProductsUrl[]> {
    let productsDOM: HTMLElement = null;
    const listUrl: ProductsUrl[] = [];
    // console.log(url);

    await this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: `Working with category: https://fashion-girl.ua${url} in "${keyOfCategory}"`,
    });

    while (true) {
      const result = await axios.get(`https://fashion-girl.ua${url}`);
      const root = parse(result.data);
      const logoSelector = '.b-header-company-name__logo';
      const logoLink = root.querySelector(logoSelector);
      const logoHref = logoLink.getAttribute('href');

      if (logoHref === 'https://fashion-girl.ua/ua/') {
        productsDOM = root;
        break;
      }
    }

    const catalogSelector = '.b-sidebar .b-nav__item-inner .b-nav__list > li';
    const categoriesList = productsDOM.querySelectorAll(catalogSelector);

    // #map parsed category into one-level array
    const topLevelList: HTMLElement[] = [];

    // for (const category of categoriesList) {
    await BlueBirdPromise.mapSeries(categoriesList, (category: HTMLElement) => {
      const hasSubCategory = category.querySelector('ul');
      let subLevelList = [];

      if (hasSubCategory) {
        const subCategories = hasSubCategory.querySelectorAll('li');
        subLevelList = subCategories.map((subCategory) => subCategory);
      }

      topLevelList.push(category);
      if (subLevelList.length) topLevelList.push(...subLevelList);
    });

    const relatedCategory = topLevelList.find((category) => {
      return category.querySelector('a').getAttribute('href') === url;
    });

    if (!relatedCategory) {
      await this.chatGateway.stopMessage({
        parser: this.shopKey,
        command: 'Can`t find the category in the sidebar',
      });
      throw new Error('Can`t find the category in the sidebar');
    }

    const productsCount =
      relatedCategory.querySelector('.b-sub-nav-list-sublist__count') ||
      relatedCategory.querySelector('.b-sub-nav-list__count');

    const productsCountValue = productsCount.textContent;

    const productsPerPage = productsDOM
      .querySelector('#product_items_per_page')
      .querySelectorAll('option')
      .find((option) => option.getAttribute('selected'))
      .getAttribute('value');

    const pagedUrls: string[] = [];

    if (+productsCountValue <= +productsPerPage) {
      listUrl.push({
        url,
        keyOfCategory,
      });
    } else {
      const maxPageNumber = Math.ceil(+productsCountValue / +productsPerPage);
      for (let i = 1; i <= maxPageNumber; i++) {
        i === 1 ? pagedUrls.push(url) : pagedUrls.push(`${url}/page_${i}`);
      }
      const pagedList = pagedUrls.map((item) => {
        return {
          url: item,
          keyOfCategory,
        };
      });
      listUrl.push(...pagedList);
    }

    return listUrl;
  }

  async getProductList(pagedCategory: ProductsUrl): Promise<string[]> {
    let categoryDOM: HTMLElement = null;

    while (true) {
      const result = await axios.get(
        `https://fashion-girl.ua${pagedCategory.url}`,
      );
      const root = parse(result.data);
      const logoSelector = '.b-header-company-name__logo';
      const logoLink = root.querySelector(logoSelector);
      const logoHref = logoLink.getAttribute('href');

      if (logoHref === 'https://fashion-girl.ua/ua/') {
        categoryDOM = root;
        break;
      }
    }

    const products = categoryDOM.querySelectorAll(
      '.b-product-gallery a.b-goods-title',
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
    let productKey = productInfo.url.slice(
      this.root.length - 'https://fashion-girl.ua'.length,
    );

    if (productKey.includes('.html')) {
      productKey = productKey.slice(0, -5);
    }

    const isProductExist = await this.productRepository.findOne({
      where: { key: productKey },
      relations: ['files'],
    });

    if (isProductExist?.disabled) {
      return;
    }

    let isPageExist = true;
    async function tryLoadPage() {
      try {
        const result = await axios.get(
          `https://fashion-girl.ua${productInfo.url}`,
        );
        const root = parse(result.data);
        const logoSelector = '.b-header-company-name__logo';
        const logoLink = root.querySelector(logoSelector);
        const logoHref = logoLink.getAttribute('href');

        if (logoHref === 'https://fashion-girl.ua/ua/') {
          productDOM = root;
        }
      } catch (e) {
        // One time I've got error "Cannot read property 'status' of undefined"
        // Probably, this error was caused by slow connection via VPN
        // Thus add here additional checking "e.response &&"
        if (e.response && e.response.status === 404) {
          isPageExist = false;
        }
      }
    }
    await retry(tryLoadPage, { max_tries: 5, interval: 100 }).catch(() => {
      isPageExist = false;
    });

    await this.chatGateway.handleMessage({
      parser: this.shopKey,
      data: `${currentProduct}/${totalProducts} Product: https://fashion-girl.ua${productInfo.url}`,
    });

    //delete product if it has finished on the site
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

    // Colors Pictures Parse
    try {
      this.colorsPicturesService.parseColorPictures(
        productDOM,
        ColorsSource.fashionGirl,
      );
    } catch (e) {
      await this.chatGateway.handleMessage({
        parser: this.shopKey,
        data: 'Some error... ' + e.message,
      });
    }

    const colorsTable = Array.prototype.map
      .call(productDOM.querySelectorAll('#sizing_table tr'), function (tr) {
        return Array.prototype.map.call(
          tr.querySelectorAll('td'),
          function (td) {
            if (td.innerText.charCodeAt(0) === 10003) {
              return true;
            } else if (td.innerText.trim() !== '') {
              return td.innerText;
            }
          },
        );
      })
      .map((el) => el.filter((item) => item))

    let colorIndex = 0
    colorsTable.forEach((elem, index) => {
      if (elem[0] === 'Цвет' || elem[0] === 'Колір') {
        colorIndex = index
      }
    })
    colorsTable.splice(0, colorIndex)

    const colorSizeMap = {};
    const sizes = colorsTable[0];
    const colors = colorsTable.slice(1);
    colors.forEach((el) => {
      if (el.some((e) => e === true)) {
        colorSizeMap[el[0]] = [];
      }
      el.forEach((color, index) => {
        if (colorSizeMap[el[0]] && color === true) {
          colorSizeMap[el[0]].push(sizes[index]);
        }
      });
    });

    const imagesList = productDOM?.querySelectorAll(
      '.b-product__images.b-images .b-images__list img',
    );

    if (!imagesList.length) {
      imagesList.push(productDOM?.querySelector('.b-product__image img'));
    }

    if (imagesList.length <= 1) {
      return;
    }

    if (!isPageExist) return;

    const isAvailable =
      productDOM?.querySelector(
        '.b-product-data .b-product-data__item_type_available',
      )?.textContent === 'В наявності';

    const name = productDOM?.querySelector(
      '.b-product__info-line .b-title span',
    );

    const priceNode = productDOM?.querySelector(
      '.b-product-cost *[data-qaid="product_price"]',
    );

    const price =
      this.parsersHelperUtils.findPrice(+parseInt(priceNode.text)) + 100;

    if (!name || !price) {
      throw new Error(
        `Не вдалось визначити ціну або Н1 товару ${productInfo.url}`,
      );
    }

    const copyRightLinkReplacer = (p: HTMLElement) => {
      const copyRightWords = ['fashion-girl.ua', 'інтернет-магазин', 'магазин'];
      const domainReplacer = {
        href: `https://${process.env.FRONT_DOMAIN}/`,
        anchor: process.env.FRONT_DOMAIN,
      };
      const link = p.querySelector('a');

      if (!link) return;

      const wordsFound = copyRightWords.find((word) =>
        link.textContent.includes(word),
      );

      if (link && wordsFound) {
        link.setAttribute('href', domainReplacer.href);
        link.textContent = domainReplacer.anchor;
      }

      return p;
    };

    const tagCleaner = (p: HTMLElement) => {
      const attributes = p.attrs;
      const classes = p.classList.value;

      if (p.tagName === 'A') return;

      Object.keys(attributes).forEach((a) => p.removeAttribute(a));
      Object.keys(classes).forEach((c) => p.classList.remove(c));
      return p;
    };

    const filterDescription = (descriptionItem: HTMLElement) => {
      let isFiltered = false;

      const excludeWords = [
        'роздріб (не дропшипінг)',
        'дропшипінг',
        'товар в обмеженій кількості',
        'viber',
        'tm',
        'роздріб',
        'опт',
        'оптом',
        'zakaz@fashion-girl.ua',
        'e-mail',
        'fg',
        'fashion girl',
        'fashion-girl',
        'fashion girl',
        'fashionGirl',
        'каталог',
      ];

      if (!descriptionItem.textContent.trim().length) {
        isFiltered = true;
      }

      const copyRightWords = ['fashion-girl.ua', 'інтернет-магазин', 'магазин'];
      const link = descriptionItem.querySelector('a');
      const notCopyRightLinkFound = !copyRightWords.find((word) =>
        link ? link.textContent.includes(word) : true,
      );

      const excludeTag = ['H2', 'IMG', 'IFRAME'];

      const subItems = descriptionItem.querySelectorAll('> *');
      const isSubItems = subItems.length;

      const shouldExclude = !!excludeWords.find((item) =>
        descriptionItem.text.toLowerCase().includes(item),
      );

      if (
        shouldExclude ||
        excludeTag.includes(descriptionItem.tagName) ||
        notCopyRightLinkFound
      ) {
        isFiltered = true;
        return isFiltered;
      }

      if (isSubItems) {
        const shouldFilter = subItems.find((subItem) => {
          const shouldExclude = !!excludeWords.find((sub) =>
            subItem.text.toLowerCase().includes(sub),
          );

          const subLink = subItem.querySelector('a');
          const notCopyRightLinkFound = !copyRightWords.find((word) =>
            subLink ? subLink.textContent.includes(word) : true,
          );

          return (
            shouldExclude ||
            excludeTag.includes(subItem.tagName) ||
            notCopyRightLinkFound
          );
        });
        shouldFilter ? (isFiltered = true) : (isFiltered = false);
      }
      return isFiltered;
    };

    const descriptionBlock = productDOM?.querySelector(
      '.b-user-content .opisanie',
    );

    const skipTags = ['IMG', 'H2', 'DIV', 'IFRAME'];
    const descriptionDOM: HTMLElement[] = [];
    await BlueBirdPromise.mapSeries(
      descriptionBlock.childNodes,
      async (node) => {
        let fineNode: HTMLElement;
        if (node instanceof HTMLElement) {
          if (node.tagName in skipTags) {
            return;
          }
          fineNode = node;
        } else if (node instanceof TextNode) {
          fineNode = new HTMLElement('P', {}, '', null);
          fineNode.textContent = node.rawText;
        } else {
          return;
        }
        descriptionDOM.push(fineNode);
      },
    );

    const filteredDescription = descriptionDOM.filter(
      (item) => !filterDescription(item),
    );

    filteredDescription.forEach((p) => {
      tagCleaner(p);
      copyRightLinkReplacer(p);

      if (p.querySelectorAll('> *').length) {
        p.querySelectorAll('> *').forEach((subP) => tagCleaner(subP));
      }
    });

    const makeDescription = (description: HTMLElement[]): string => {
      let string = '';
      description.forEach((item) => {
        string += item.outerHTML;
      });
      return string;
    };

    const makeCharacteristics = async (): Promise<ParserSpec> => {
      const list = productDOM.querySelector('.b-user-content .attributes');
      return _extractCharsFromHtml(list.outerHTML);
    };

    const _extractCharsFromHtml = async (html: string): Promise<ParserSpec> => {
      const liElems = parse(html).querySelectorAll('li');
      const charsList: ParserSpec = {};
      let nameSaved: string;

      await BlueBirdPromise.mapSeries(liElems, (node, index) => {
        let { val } = _extractNameValue(liElems[index]);
        const { name } = _extractNameValue(liElems[index]);
        if (name.length) {
          nameSaved = name;
        } else {
          nameSaved = '';
        }

        if (nameSaved.length && val.length) {
          charsList[nameSaved] = val;
        }
        nameSaved = '';
        val = '';
      });
      for (let i = 0; i < liElems.length; i++) {}
      return charsList;
    };

    const _extractNameValue = (
      item: HTMLElement,
    ): { name: string; val: string } => {
      const nameVal = { name: '', val: '' };
      const arr = item.textContent.split(':');

      if (arr.length >= 2) {
        // "Стиль: Casual" or "Довжина крокового шва:"
        nameVal.name = arr.shift().trim();
        nameVal.val = arr.join(':').trim(); //if characteristic value contains ":" too
      } else if (arr.length === 1) {
        // "79-80 см", consider it as only value
        nameVal.val = arr[0].trim();
      } else {
        throw `Could not parse characteristic correctly. Given text: '${item.textContent}'.`;
      }
      return nameVal;
    };

    const description = makeDescription(filteredDescription);
    const characteristics = await makeCharacteristics();
    const characteristicsWithColors = {
      ...characteristics,
      'Кольори та розміри': colorSizeMap,
    };

    if (description.length < 60 && !isProductExist) {
      return;
    }

    //Product parsing
    const relatedCategory = await this.subCategoryRepository.findOne({
      where: { key: productInfo.keyOfCategory },
      relations: ['characteristicGroup', 'characteristicGroup.characteristic'],
    });

    const url = await this.productService.generateProductUrl(relatedCategory);

    // Removal from the product name: "Батал, Норма, Розпродаж, ..."
    let nameCutIndex = name.textContent.length;
    if (name.textContent.indexOf('|') > 0) {
      nameCutIndex = name.textContent.indexOf('|');
    } else if (name.textContent.indexOf('I Норма') > 0) {
      nameCutIndex = name.textContent.indexOf('I Норма');
    } else if (name.textContent.indexOf('⁇') > 0) {
      nameCutIndex = name.textContent.indexOf('⁇');
    } else if (name.textContent.indexOf('⁇') > 0) {
      nameCutIndex = name.textContent.indexOf('⁇');
    } else if (name.textContent.indexOf('I Розпродаж') > 0) {
      nameCutIndex = name.textContent.indexOf('I Розпродаж');
    } else if (name.textContent.indexOf('I  Розпродаж') > 0) {
      nameCutIndex = name.textContent.indexOf('I  Розпродаж');
    } else if (name.textContent.indexOf('Розпродаж') > 0) {
      nameCutIndex = name.textContent.indexOf('Розпродаж');
    }

    const product: Partial<Product> = {
      price: Math.floor(price),
      key: productKey,
      url,
      availability: true,
      category: relatedCategory,
      shopKey: this.shopKey,
      name: this.parsersHelperUtils.clearNameFromUnicodeSymbols(
        name.textContent.substring(0, nameCutIndex).replace(/\s\s+/g, ' ')
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
            characteristicsWithColors,
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

    const imageLinks = imagesList.map((image) => {
      const src = image.getAttribute('src');
      const srcArr = src.split('_');

      const mappedSrcArr = srcArr.map((item) => {
        const width = item === 'w100';
        const height = item === 'h100';

        if (width) item = 'w2000';
        if (height) item = 'h2000';

        return item;
      });

      return mappedSrcArr.join('_');
    });

    const images = await this.imageUtilsService.imagesUploader(
      imageLinks,
      'fashionGirl',
    );
    await this.productService.uploadMultipleImage(images, {
      productId: finalProduct.id,
    });

    await this.parsersHelperUtils.createCharacteristics(
      relatedCategory,
      finalProduct.id,
      characteristicsWithColors,
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
    const { createNewProducts } = params.settings[this.shopKey];
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
    await BlueBirdPromise.each(
      parsedCategories,
      async (parsed, index, arrayLength) => {
        let relatedCategoryInfo = null;

        await BlueBirdPromise.mapSeries(simpleMap, (category) => {
          if (category.shopKeys && category.shopKeys.length) {
            category.shopKeys.find((key) => {
              if (key[this.shopKey] == parsed.key) {
                relatedCategoryInfo = {
                  keyOfCategory: category.key,
                  url: key[this.shopKey],
                };
              }
            });
          }
        });

        if (relatedCategoryInfo) {
          try {
            const parserSettings = await this.parserSettingsRepository.findOne({
              parserName: this.shopKey,
            });
            if (parserSettings.parserStatus !== EParserStatus.stopped) {
              const pagedList = await this.getCategoryUrlsWithPagination(
                relatedCategoryInfo.url,
                relatedCategoryInfo.keyOfCategory,
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
      const currentListFiltred = await BlueBirdPromise.filter(
        currentList,
        async (item) => {
          let productKey = item.slice(this.root.length);

          if (productKey.includes('.html')) {
            productKey = productKey.slice(0, -5);
          }

          const isProductExist = await this.productRepository.findOne({
            where: { key: productKey },
            relations: ['files'],
          });
          if (!createNewProducts && !isProductExist) {
            return false;
          }
          return true;
        },
      );

      const mappedList = currentListFiltred.map((item) => ({
        url: item,
        keyOfCategory: pagedCategory.keyOfCategory,
      }));
      productsList.push(...mappedList);
    });
    return productsList;
  }
}
