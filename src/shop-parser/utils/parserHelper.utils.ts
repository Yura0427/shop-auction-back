import { Inject, Injectable } from '@nestjs/common';
import { Repository, TreeRepository } from 'typeorm';
import { Category } from '../../category/category.entity';
import { CategoryService } from '../../category/categories.service';
import {
  BaseCategory,
  Categories,
  CategoryToSave,
  CheckedCategory,
  DefaultCategories,
  ParserSpec,
  SimpleMap,
} from '../parser';
import { Product } from 'src/product/product.entity';
import { CharacteristicsValuesService } from 'src/characteristics-values/characteristics-values.service';
import { UpdateTreeCategoryDto } from 'src/category/dto/updateTreeCategory.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { cache } from '../../category/category.controller';
import * as BlueBirdPromise from 'bluebird';
import { defaultCategories } from '../categiries-servise/tree-default-categories';
import { treeCategories } from '../categiries-servise/tree-categories-keys';
import { ProductService } from 'src/product/product.service';
import { ParserSettings } from '../parserSettings.entity';
import { ChatGateway } from 'src/socket/socket-console.gateway';
import { ProductToOrder } from '../../product-to-order/product-to-order.entity';

@Injectable()
export class ParsersHelperUtils {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductToOrder)
    private productToOrderRepository: Repository<ProductToOrder>,
    @InjectRepository(Category)
    private subCategoryRepository: TreeRepository<Category>,
    @InjectRepository(ParserSettings)
    private parserSettingsRepository: Repository<ParserSettings>,
    @Inject('ProductService')
    private productService: ProductService,
    @Inject('CategoryService')
    private categoryService: CategoryService,
    @Inject('ChatGateway')
    private chatGateway: ChatGateway,
  ) {}

  public findPrice(price: number): number {
    if (price > 2000) {
      return Math.ceil((price * 1.3) / 5) * 5;
    } else if (price >= 500 && price <= 2000) {
      return Math.ceil((price * 1.5) / 5) * 5;
    } else if (price >= 120 && price < 500) {
      return Math.ceil((price * 2) / 5) * 5;
    } else if (price > 50 && price < 120) {
      return price + 120;
    } else if (price <= 50) {
      return price + 50;
    } else {
      return Math.ceil((price * 2) / 5) * 5;
    }
  }

  async createCharacteristics(
    relatedCategory: Category,
    relatedProductId: number,
    characteristics: ParserSpec | string,
    productRepository: Repository<Product>,
    categoryService: CategoryService,
    characteristicsValuesService: CharacteristicsValuesService,
  ): Promise<any> {
    const relatedProduct = await productRepository.findOne(relatedProductId, {
      relations: ['characteristicValue'],
    });

    let checkedCharacteristics = {};

    if (
      characteristics ||
      (characteristics && Object.keys(characteristics).length) ||
      relatedProduct.characteristicValue.length
    ) {
      const arrayOfCharracteristics = Object.entries(characteristics);
      for (let element of arrayOfCharracteristics) {
        const isExist = relatedProduct.characteristicValue.some(
          (obj) => obj.name === element[0] && obj,
        );
        if (!isExist) {
          checkedCharacteristics = {
            ...checkedCharacteristics,
            [element[0]]: element[1],
          };
        }
      }
    }

    if (
      !checkedCharacteristics ||
      (checkedCharacteristics && !Object.keys(checkedCharacteristics).length) ||
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

      updatedCategory = await categoryService.updateTreeCategory(
        categoryToUpdate as UpdateTreeCategoryDto,
      );
    }

    const createdChars = updatedCategory.characteristicGroup[0].characteristic;

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

    await characteristicsValuesService.createCharacteristicValue(
      charValuesToCreate,
    );
  }

  async checkIfCategoryExist(
    categories: CheckedCategory[],
  ): Promise<CheckedCategory[]> {
    const findConditions = categories.map((category) => ({
      key: category.key,
    }));

    const existedMainCategories = await this.subCategoryRepository.find({
      where: findConditions,
    });

    return categories.filter((category) => {
      return !existedMainCategories.find((existedCategory) => {
        return existedCategory.key === category.key;
      });
    });
  }

  async buildEasyCategoryMap(
    treeCategories: Categories[],
  ): Promise<SimpleMap[]> {
    const categories: SimpleMap[] = [];

    (function buildRecursive(
      treeCategories: Categories[],
      keyOfParent?: string,
    ) {
      for (const category of treeCategories) {
        const { subCategories, ...baseFields } = category;

        const parentKey = keyOfParent ? keyOfParent : null;

        if (!subCategories.length) {
          categories.push({ ...baseFields, parentKey });
        } else {
          buildRecursive(subCategories, baseFields.key);
        }
      }
    })(treeCategories, null);

    return categories;
  }

  async createMainCategories(
    defaultCategories: DefaultCategories[],
    stackCategory?: Category,
  ): Promise<any> {
    await BlueBirdPromise.mapSeries(defaultCategories, async (category) => {
      const { subCategories, ...baseFields } = category;

      let currentCategory = null;
      const parent = stackCategory ? stackCategory : null;

      const isExist = await this.subCategoryRepository.findOne({
        key: category.key,
      });

      if (!isExist) {
        currentCategory = await this.subCategoryRepository.save({
          ...baseFields,
          parent,
        });
      }

      if (subCategories.length) {
        await this.createMainCategories(subCategories, currentCategory);
      }
    });
  }

  async createSubCategories(
    subCategoriesToSave: CategoryToSave[],
  ): Promise<Category[]> {
    const notExistSubCategories = await this.checkIfCategoryExist(
      subCategoriesToSave,
    );
    // #remove duplicate if exist
    const notDuplicateCategories = notExistSubCategories.filter(
      (category, index, array) =>
        index === array.findIndex((item) => category.key === item.key),
    );

    const allMainCategories = await this.subCategoryRepository.find();

    const mappedSubCategories = notDuplicateCategories.map((subCategory) => {
      const { parentKey, ...mainFields } = subCategory;

      const parentCategory = allMainCategories.find(
        (mainCategory) => mainCategory.key === parentKey,
      );

      return {
        ...mainFields,
        parent: parentCategory,
      };
    });

    return this.subCategoryRepository.save(mappedSubCategories);
  }

  async createParsedCategories(
    parsedCategories: BaseCategory[],
    shopKey: string,
  ): Promise<any> {
    await this.chatGateway.handleMessage({
      parser: shopKey,
      data: `Start creating categories of ${shopKey}`,
    });
    await this.createMainCategories(defaultCategories, null);
    await this.chatGateway.handleMessage({
      parser: shopKey,
      data: `Main categories of ${shopKey} have been successfully created`,
    });

    const categoriesToCreate = await this.buildEasyCategoryMap(treeCategories);

    const builtCategory = await this.buildCategoriesToSave(
      categoriesToCreate,
      parsedCategories,
      shopKey,
    );

    await this.createSubCategories(builtCategory);
    await this.chatGateway.handleMessage({
      parser: shopKey,
      data: `Subcategories of ${shopKey} have been processed successfully`,
    });
  }

  findRelatedCategory(
    categoriesMap: SimpleMap[],
    categoryForFind: CheckedCategory,
    shopKey: string,
  ): any {
    const categoryKeyToKey = {
      fashionGirl: 'key',
      pobedov: 'pobedov',
    };

    return categoriesMap.find((category) => {
      if (category.shopKeys && category.shopKeys.length) {
        return category.shopKeys.find((key) => {
          if (typeof key[shopKey] === 'string') {
            return key[shopKey] === categoryForFind[categoryKeyToKey[shopKey]];
          }

          if (Array.isArray(key[shopKey])) {
            return key[shopKey].find(
              (subKey) => subKey === categoryForFind[categoryKeyToKey[shopKey]],
            );
          }
        });
      }
    });
  }

  async buildCategoriesToSave(
    categoryKeys: SimpleMap[],
    parsedCategories: CheckedCategory[],
    shopKey: string,
  ): Promise<CategoryToSave[]> {
    const categoryToSave: CategoryToSave[] = [];

    const categoryNameToKey = {
      fashionGirl: 'name',
    };

    await BlueBirdPromise.mapSeries(parsedCategories, (parsed) => {
      let currentEntity = null;

      currentEntity = this.findRelatedCategory(categoryKeys, parsed, shopKey);
      if (currentEntity) {
        categoryToSave.push({
          name: currentEntity.name
            ? currentEntity.name
            : parsed[categoryNameToKey[shopKey]],
          key: currentEntity.key,
          description: currentEntity.name
            ? currentEntity.name
            : parsed[categoryNameToKey[shopKey]],
          parentKey: currentEntity.parentKey,
        });
      }
    });

    return categoryToSave;
  }

  private async disableCategories(ids: number[]) {
    return this.subCategoryRepository
      .createQueryBuilder('categories')
      .update(Category)
      .set({ disabled: true })
      .whereInIds(ids)
      .execute();
  }

  private async enableAllCategories() {
    await this.subCategoryRepository
      .createQueryBuilder('categories')
      .where({ disabled: true })
      .update(Category)
      .set({ disabled: false })
      .execute();
  }

  async disableEmptyCategories() {
    await this.enableAllCategories();

    const tree = await this.subCategoryRepository.findTrees();
    const lastChildren: Category[] = [];

    const buildRecursiveChildren = (categories: Category[]) => {
      for (const category of categories) {
        if (!category.children.length) {
          lastChildren.push(category);
        } else {
          buildRecursiveChildren(category.children);
        }
      }
    };

    buildRecursiveChildren(tree);

    const categoriesId = lastChildren.map((item) => item.id);

    const qb = this.subCategoryRepository.createQueryBuilder('categories');

    const ctWithProductsCount = await qb
      .whereInIds(categoriesId)
      .innerJoin('categories.products', 'product')
      .getMany();

    const idsToDisable = lastChildren
      .filter(
        (category) =>
          !ctWithProductsCount.find((item) => item.id === category.id),
      )
      .map((filtered) => filtered.id);

    await this.disableCategories(idsToDisable);

    const newTree = await this.subCategoryRepository.findTrees();

    let parentIdsToDisable: number[] = [];
    function findParentIdsToDisable(categories: Category[]) {
      categories.forEach((category) => {
        findParentIdsToDisable(category.children);
        if (category.children.length > 0) {
          if (category.children.every((child) => child.disabled === true)) {
            category.disabled = true;
            parentIdsToDisable.push(category.id);
          }
        }
      });
    }

    findParentIdsToDisable(newTree);
    await this.disableCategories(parentIdsToDisable);
    await this.categoryService.setTreesToCache(cache);

    return;
  }

  async redisableCategoriesWithProducts() {
    const categoriesToRedisable = await this.subCategoryRepository
      .createQueryBuilder('categories')
      .innerJoin('categories.products', 'product')
      .where({ disabled: true })
      .getMany();

    const idsToRedisableWithParents = [
      ...new Set(
        categoriesToRedisable
          .map((category) => {
            return category.mpath.split('.').filter((id) => id);
          })
          .flat(),
      ),
    ];

    await this.subCategoryRepository
      .createQueryBuilder('categories')
      .update(Category)
      .set({ disabled: false })
      .whereInIds(idsToRedisableWithParents)
      .execute();

    await this.categoryService.setTreesToCache(cache);

    return;
  }

  async parserCleaner(shopKey: string, parserKey: string): Promise<any> {
    const allParsedProducts = await this.productRepository.find({
      where: { shopKey },
    });

    await this.chatGateway.saveParserErrorToDB({
      parser: parserKey,
      errorStatus: null,
      lastParsedProduct: null,
      lastError: null,
    });

    if (allParsedProducts?.length < 1) {
      await this.chatGateway.stopMessage({
        parser: parserKey,
        command: `There are no products with key: ${shopKey} in the database`,
      });
      return {
        message: `There are no products with key: ${shopKey} in the database`,
      };
    }

    await this.chatGateway.handleMessage({
      parser: parserKey,
      data: `Start deleting products by key: ${shopKey}`,
    });

    try {
      const productIds = allParsedProducts.map((product) => product.id);

      const allProductsInOrders = await this.productToOrderRepository
        .createQueryBuilder('product_to_order')
        .leftJoinAndSelect('product_to_order.product', 'product')
        .leftJoinAndSelect('product_to_order.order', 'order')
        .where('product_to_order.product.id IN (:...productIds)', {
          productIds,
        })
        .getMany();

      const allProductsInOrdersIds = allProductsInOrders.map(
        (x) => x.productId,
      );
      const uniqueAllProductsInOrdersIds = allProductsInOrdersIds
        ? allProductsInOrdersIds?.filter(function (item, pos) {
            return allProductsInOrdersIds.indexOf(item) == pos;
          })
        : [];

      await this.chatGateway.handleMessage({
        parser: parserKey,
        data: `${
          productIds?.length - uniqueAllProductsInOrdersIds.length
        } products must be removed and ${
          uniqueAllProductsInOrdersIds.length
        } will be disabled
Please wait... The process may take more than 10 minutes, depending on the speed of the connection and the number of products`,
      });

      const promises = productIds.map((productId) => {
        return this.productService.deleteProducts(productId);
      });
      await Promise.all(promises);
    } catch (e) {
      await this.chatGateway.stopMessage({
        parser: parserKey,
        command: e.message,
      });
      return { message: e.message };
    }
    await this.chatGateway.stopMessage({
      parser: parserKey,
      command: `All files and products of the ${shopKey} store have been deleted`,
    });

    // check all categories and refresh cache
    await this.disableEmptyCategories();
    return {
      message: `All files and products of the ${shopKey} store have been deleted`,
    };
  }

  async getStatus(): Promise<any> {
    const parserSettings = await this.parserSettingsRepository.find();
    const parserSettingsWithAllParsedProducts = await Promise.all(
      parserSettings.map(async (el) => {
        const allParsedProducts = await this.productRepository.find({
          where: { shopKey: el.parserName },
        });
        return { ...el, allParsedProducts: allParsedProducts.length };
      }),
    );

    return parserSettingsWithAllParsedProducts;
  }

  clearNameFromUnicodeSymbols(name: string) {
    function decodeUnicode(str: string): string {
      return str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
    }

    const checkForUnicode = /\&#[0-9]{1,5};/g;
    if (checkForUnicode.test(name)) {
      return decodeUnicode(name);
    }
    return name;
  }
}
