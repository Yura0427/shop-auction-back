import {
  BadRequestException,
  Injectable,
  HttpException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { In, Repository, TreeRepository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as NodeCache from 'node-cache';
import * as fs from 'fs';
import * as path from 'path';

import { Category, CustomCategory } from './category.entity';
import { Product } from '../product/product.entity';
import { File } from '../files/files.entity';
import { CustomizeError } from 'src/product/customize-error';
import { CharacteristicGroup } from '../characteristic-group/characteristic-group.entity';
import { Characteristic } from '../characteristics/characteristics.entity';
import { CustomValidation } from '../utils/custom-validation';
import { CreateTreeCategoryDto } from './dto/create-tree-category.dto';
import { TreeCategory } from './category';
import { UpdateTreeCategoryDto } from './dto/updateTreeCategory.dto';
import { ProductService } from '../product/product.service';
import { DisableCategoryDto } from './dto/disable-category.dto';
import { IFile } from 'src/interfaces/file.interface';
import { ImageUtilsService } from 'src/image/image-utils.service';
import { FilesService } from 'src/files/files.service';
import { Source } from '../image/cropper.enum';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: TreeRepository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(CharacteristicGroup)
    private readonly characteristicGroupRepository: Repository<CharacteristicGroup>,
    @InjectRepository(Characteristic)
    private readonly characteristicRepository: Repository<Characteristic>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @Inject(forwardRef(() => ProductService))
    private productService: ProductService,
    private imageUtilsService: ImageUtilsService,
    private filesService: FilesService,
  ) {
    this.categoryRepository.metadata.columns.find(
      (x) => x.databaseName === 'mpath',
    ).isVirtual = false;
  }

  private recursiveFilter = (item: Category) => {
    const result = { ...item };

    result.children = result.children.filter((element) => {
      if (item.children.length) this.recursiveFilter(element);
      return element.disabled !== true;
    });

    return result;
  };

  public async setTreesToCache(
    cache: NodeCache | null,
    hideDisabled?: boolean,
  ): Promise<Category[]> {
    const categories = await this.categoryRepository
      .createQueryBuilder('categories')
      .leftJoin('categories.parent', 'parent')
      .addSelect('parent.id')
      .leftJoin('categories.icon', 'icon')
      .addSelect('icon')
      .getMany();

    const trees = this.parseCategories(categories);

    const openTrees = [];
    trees.forEach((element) => {
      if (element.disabled !== true) {
        openTrees.push(this.recursiveFilter(element));
      }
    });

    cache && cache.set('categories', trees);
    cache && cache.set('openCategories', openTrees);

    return hideDisabled ? openTrees : trees;
  }

  private getTreesFromCache(cache: NodeCache): Category[] {
    return cache.get<Category[]>('categories');
  }

  private getOpenTreesFromCache(cache: NodeCache): Category[] {
    return cache.get<Category[]>('openCategories');
  }

  private parseCategories = (categories: Category[]): Category[] => {
    const categoriesIdsByIndex = {};
    const roots = [];
    let category;

    categories.forEach((category, i) => {
      categoriesIdsByIndex[category.id] = i;
      category.children = [];
    });

    categories.forEach((item) => {
      category = item;

      if (category.parent) {
        categories[categoriesIdsByIndex[category.parent.id]].children.push(
          category,
        );
      } else {
        roots.push(category);
      }
    });

    return roots;
  };

  async findTrees(cache: NodeCache, hideDisabled = false): Promise<Category[]> {
    let cachedCategories = this.getTreesFromCache(cache);
    let cachedOpenCategories = this.getOpenTreesFromCache(cache);

    if (!cachedCategories?.length) {
      cachedCategories = await this.setTreesToCache(cache);
    }

    if (!cachedOpenCategories?.length && hideDisabled) {
      cachedOpenCategories = await this.setTreesToCache(cache, hideDisabled);
    }

    return hideDisabled ? cachedOpenCategories : cachedCategories;
  }

  public async getProducts(id: number): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.category = :categoryId', { categoryId: id })
      .getMany();
  }

  async getTreeCategoryById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: [
        'children',
        'parent',
        'characteristicGroup',
        'characteristicGroup.characteristic',
        'icon',
      ],
    });
    new CustomValidation().notFound('Категорія', 'id', id, category);

    return category;
  }

  async getTreeCategoryByKey(
    key: string,
    hideDisabled = false,
  ): Promise<CustomCategory> {
    const category = await this.categoryRepository.findOne({
      where: { key },
      relations: [
        'characteristicGroup',
        'characteristicGroup.characteristic',
        'icon',
      ],
    });

    new CustomValidation().notFound('Категорія', 'key', key, category);

    let descTree = await this.categoryRepository.findDescendantsTree(category);

    if (hideDisabled) {
      descTree = this.recursiveFilter(descTree);
    }

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

    let priceRange;

    if (!descTree.children.length) {
      const categoryQuery = this.productRepository.createQueryBuilder(
        'products',
      );

      priceRange = await categoryQuery
        .innerJoin('products.category', 'category')
        .where('category.key = :key AND products.disabled = :disabled', {
          key,
          disabled: false,
        })
        .select('MAX(products.price)', 'max')
        .addSelect('MIN(products.price)', 'min')
        .getRawOne();
    }

    return { ascCategories, priceRange, ...descTree };
  }

  async createTreeCategory(
    dto: CreateTreeCategoryDto,
    cache: NodeCache,
    file: IFile,
  ): Promise<TreeCategory> {
    const { parentId, description, key, name, children } = dto;

    const isExist = await this.categoryRepository.findOne({
      where: [{ key }],
    });

    new CustomValidation().isExists('Категорія', `key`, key, isExist);

    const newCategory = this.categoryRepository.create({
      description,
      name,
      key,
    });

    let relatedParent;

    if (parentId) {
      relatedParent = await this.categoryRepository.findOne({
        where: {
          id: parentId,
        },
      });
      new CustomValidation().notFound(
        'Категорію',
        'id',
        parentId,
        relatedParent,
      );

      newCategory.parent = relatedParent;
    }

    const category = await this.categoryRepository.save(newCategory);

    let subCategories = [];

    if (children?.length) {
      const newSubCategories = children.map((subCategory) => {
        const newSubCategory = this.categoryRepository.create(subCategory);
        newSubCategory.parent = category;

        return newSubCategory;
      });

      subCategories = await this.categoryRepository.save(newSubCategories);
    }

    await this.imageUtilsService
      .imageOptimize(file.filename)
      .catch(console.error);
    await this.fileRepository.save({ name: file.filename, category });

    if (process.env.NODE_ENV !== 'local') {
      let fileNames = [];
      fileNames.push(file.filename);
      await this.imageUtilsService
        .uploadToStorage(fileNames)
        .catch(console.error);
    }

    this.setTreesToCache(cache);

    return {
      ...category,
      children: subCategories,
    };
  }

  private async regenerateProductUrls(
    oldCategory: Category,
    newCategory: Category,
  ) {
    const allProducts = await this.productRepository.find({
      where: { category: oldCategory },
    });

    const newUrl = await this.productService.generateProductUrl(newCategory);

    const updatedProducts = allProducts.map((product) => ({
      ...product,
      url: `${newUrl}/${oldCategory.key}`,
    }));

    return this.productRepository.save(updatedProducts);
  }

  async updateTreeCategory(
    dto: UpdateTreeCategoryDto,
    cache?: NodeCache,
    file?: IFile,
  ) {
    try {
      const {
        characteristicGroups,
        id,
        removedCharacteristics,
        parentCategory,
        ...categoryFields
      } = dto;

      if (removedCharacteristics) {
        const {
          characteristicGroupIDs,
          characteristicIDs,
        } = removedCharacteristics;

        if (characteristicIDs) {
          const result = await this.characteristicRepository.findByIds(
            characteristicIDs,
          );
          new CustomValidation().multipleNotFound(
            result,
            characteristicIDs,
            'Характеристики',
          );
          await this.characteristicRepository.delete(characteristicIDs);
        }

        if (characteristicGroupIDs) {
          const result = await this.characteristicGroupRepository.findByIds(
            characteristicGroupIDs,
          );
          new CustomValidation().multipleNotFound(
            result,
            characteristicGroupIDs,
            'Группи характеристик',
          );
          await this.characteristicGroupRepository.delete(
            characteristicGroupIDs,
          );
        }
      }
      const characteristics = [];

      const relatedCategory = await this.categoryRepository.findOne(id, {
        relations: ['children', 'parent', 'icon'],
      });

      // const existedGroup = await this.characteristicGroupRepository.find({
      //   where: { category: { id: relatedCategory.id } },
      // });

      // if (existedGroup.length > 0) {
      //   return await this.categoryRepository.findOne(id, {
      //     relations: [
      //       'characteristicGroup',
      //       'characteristicGroup.characteristic',
      //       'parent',
      //       'children',
      //       'icon',
      //     ],
      //   });
      // }

      new CustomValidation().notFound('Категорію', 'ID', id, relatedCategory);

      const updatedCategory: Partial<Category> = {
        ...categoryFields,
        id,
      };

      let relatedMainCategory;

      if (parentCategory) {
        relatedMainCategory = await this.categoryRepository.findOne({
          where: { id: parentCategory },
        });
        new CustomValidation().notFound(
          'Категорію',
          'id',
          parentCategory,
          relatedMainCategory,
        );

        updatedCategory.parent = relatedMainCategory;
      }

      // if (
      //   relatedCategory.children.length &&
      //   (characteristicGroups || removedCharacteristics)
      // ) {
      //   throw new BadRequestException(
      //     `Дана категорія має children: ${relatedCategory.children.length} і тому не може мати характеристики.`,
      //   );
      // }

      if (characteristicGroups) {
        const mappedGroupCharacteristics = characteristicGroups.map((group) => {
          if (!group.id) return { name: group.name, category: relatedCategory };
          else
            return {
              id: group.id,
              name: group.name,
              category: relatedCategory,
            };
        });

        const updatedCharacteristicGroups = await this.characteristicGroupRepository.save(
          mappedGroupCharacteristics,
        );

        for (let i = 0; i < characteristicGroups.length; i++) {
          const relatedGroup = updatedCharacteristicGroups.find((group) => {
            return group.name === characteristicGroups[i].name;
          });

          for (
            let j = 0;
            j < characteristicGroups[i].characteristics.length;
            j++
          ) {
            characteristics.push({
              ...characteristicGroups[i].characteristics[j],
              group: relatedGroup,
              category: relatedCategory,
            });
          }
        }

        new CustomValidation().characteristicMinMaxChecker(characteristics);
        await this.characteristicRepository.save(characteristics);
      }

      const category = await this.categoryRepository.save(updatedCategory);

      if (file) {
        if (relatedCategory.icon !== null) {
          await this.filesService.deleteImage(relatedCategory.icon.name);
        }

        if (file.filename.includes('undefined')) {
          await this.imageUtilsService.iconUpdateName(file.filename, dto.key);
          file.filename = `${dto.key}.svg`;

          await this.imageUtilsService
            .imageOptimize(file.filename)
            .catch(console.error);
          await this.fileRepository.save({ name: file.filename, category });

          if (process.env.NODE_ENV !== 'local') {
            let fileNames = [];
            fileNames.push(file.filename);
            await this.imageUtilsService
              .uploadToStorage(fileNames)
              .catch(console.error);
          }
        } else {
          await this.imageUtilsService
            .imageOptimize(file.filename)
            .catch(console.error);
          await this.fileRepository.save({ name: file.filename, category });

          if (process.env.NODE_ENV !== 'local') {
            let fileNames = [];
            fileNames.push(file.filename);
            await this.imageUtilsService
              .uploadToStorage(fileNames)
              .catch(console.error);
          }
        }
      }

      if (parentCategory && relatedCategory.parent?.id !== parentCategory) {
        await this.regenerateProductUrls(relatedCategory, relatedMainCategory);
      }

      cache && this.setTreesToCache(cache);

      return this.categoryRepository.findOne(id, {
        relations: [
          'characteristicGroup',
          'characteristicGroup.characteristic',
          'parent',
          'children',
          'icon',
        ],
      });
    } catch (error) {
      await new CustomizeError().checkError(
        error,
        this.categoryRepository,
        dto,
      );
    }
  }

  async deleteTreeCategory(id: number, cache: NodeCache) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['icon'],
    });

    new CustomValidation().notFound('Категорію', 'ID', id, category);

    const childrens = await this.categoryRepository
      .createDescendantsQueryBuilder('category', 'categoryClosure', category)
      .leftJoin('category.icon', 'icon')
      .addSelect('icon')
      .getMany();

    try {
      await this.categoryRepository.delete(id);
      this.setTreesToCache(cache);

      if (childrens.length) {
        childrens.map(async (children) => {
          if (children.icon) {
            this.filesService.deleteImage(children.icon.name);
          }
        });
      } else {
        await this.filesService.deleteImage(category.icon.name);
      }

      return { message: `Категорія з ID: ${id} успішно видалена` };
    } catch (error) {
      throw new HttpException(
        'Ви не можете видалити цю категорію, бо у ній є товари',
        405,
      );
    }
  }

  private async handleDisableEnableCategories(
    ids: number[],
    disable: boolean,
    cache: NodeCache,
    productId?: number,
  ) {
    await this.setTreesToCache(cache);

    if (productId) {
      await this.productRepository
        .createQueryBuilder('products')
        .update(Product)
        .set({ disabled: disable })
        .where({ id: productId })
        .execute();
    } else {
      const allProductsByCategoryIds = await this.productRepository
        .createQueryBuilder('products')
        .innerJoin('products.category', 'category')
        .where('products.category.id IN (:...ids)', {
          ids,
        })
        .execute();

      const productIds = allProductsByCategoryIds.map((pr) => {
        return pr.products_id;
      });

      await this.productRepository
        .createQueryBuilder('products')
        .update(Product)
        .set({ disabled: disable })
        .whereInIds(productIds)
        .execute();
    }
  }

  async disableEnableCategory(
    dto: DisableCategoryDto,
    cache: NodeCache,
    productId?: number,
  ) {
    const { id, disable } = dto;
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent'],
    });
    new CustomValidation().notFound('Категорію', 'ID', id, category);

    const categoryChildren = await this.categoryRepository.findDescendants(
      category,
    );
    const categoryChildrenIds = categoryChildren.map((category) => category.id);
    const categoryParents = await this.categoryRepository
      .createAncestorsQueryBuilder('category', 'children', category.parent)
      .leftJoinAndSelect('category.children', 'children')
      .getMany();

    if (disable) {
      if (!category.parent) {
        this.handleDisableEnableCategories(categoryChildrenIds, disable, cache);
      } else {
        let parentsIdsToDisable = [];
        categoryParents.forEach((category) => {
          if (category.children.length > 1) {
            const disabledChildren = category.children.filter(
              (child) => child.disabled === true,
            );
            if (category.children.length - disabledChildren.length === 1) {
              parentsIdsToDisable.push(category.id);
            }
          } else {
            parentsIdsToDisable.push(category.id);
          }
        });
        this.handleDisableEnableCategories(
          [...new Set([...categoryChildrenIds, ...parentsIdsToDisable])],
          disable,
          cache,
        );
      }
    } else {
      if (!category.parent) {
        await this.handleDisableEnableCategories(
          categoryChildrenIds,
          disable,
          cache,
          productId,
        );
      } else {
        const parentsIdsToEnable = categoryParents.map(
          (category) => category.id,
        );
        await this.handleDisableEnableCategories(
          [...new Set([...categoryChildrenIds, ...parentsIdsToEnable])],
          disable,
          cache,
          productId,
        );
      }
    }

    return {
      message: `Категорію з ID: ${id} успішно ${
        disable ? `вимкнуто` : `увімкнено`
      }`,
    };
  }

  async uploadCategoryImage(files: IFile[]) {
    const filteredFiles: IFile[] = [];
    const extRegex = /\.(jpg|jpeg|png)$/i;
    const extErrors = [];

    for (let i = 0; i < files.length; i += 1) {
      const ext = path.extname(files[i].originalname);

      if (!extRegex.test(ext)) {
        extErrors.push({
          file: files[i].originalname,
          message: 'Можна завантажувати тільки файли у форматі jpg/png',
        });
      } else {
        filteredFiles.push(files[i]);
      }
    }

    const metaDataErrors = await this.imageUtilsService.checkImagesForSize(
      filteredFiles,
    );

    const namesErrors = [];
    for (let i = 0; i < filteredFiles.length; i += 1) {
      const fileName = filteredFiles[i].originalname.split('.')[0];
      const category = await this.categoryRepository.findOne({
        key: fileName,
      });

      if (!category) {
        namesErrors.push({
          file: filteredFiles[i].originalname,
          message: 'Не знайдено жодної категорії, яка відповідає імені файлу',
        });
      }
    }

    const errors = [...extErrors, ...metaDataErrors, ...namesErrors];

    if (errors.length) {
      await Promise.all(
        files.map(async (file) => await fs.promises.unlink(file.path)),
      );
      return { success: false, message: 'Деякі файли містять помилки', errors };
    }

    await this.imageUtilsService
      .imageProcessor(files, Source.category)
      .catch(console.error);

    const mappedFileNames: string[] = [];

    files.forEach((file) => mappedFileNames.push(file.filename));

    await this.imageUtilsService.moveFilesToCategoryDir(mappedFileNames);

    if (process.env.NODE_ENV !== 'local') {
      await this.imageUtilsService.findAndDeleteOldImagesFromBucket(
        mappedFileNames,
      );

      await this.imageUtilsService
        .uploadToStorage(mappedFileNames, Source.category)
        .catch(console.error);

      await this.imageUtilsService.imageRemover(mappedFileNames);
    }

    return { success: true, message: 'Зображення успішно змінено' };
  }

  public async deleteCategoryCharacteristics(categoryId: number) {
    const categoryWithCharacteristics = await this.categoryRepository
      .createQueryBuilder('category')
      .where('category.id = :id', { id: categoryId })
      .leftJoinAndSelect('category.characteristics', 'chars')
      .leftJoinAndSelect('category.characteristicGroup', 'charsGroup')
      .leftJoinAndSelect('category.products', 'products')
      .getOne();

    if (categoryWithCharacteristics.products.length) {
      new CustomValidation().productsInCategoryExists(
        categoryWithCharacteristics.name,
      );
    }

    if (categoryWithCharacteristics.characteristicGroup.length) {
      const charsGroupId = [];

      categoryWithCharacteristics.characteristicGroup.forEach((char) =>
        charsGroupId.push(char.id),
      );

      this.characteristicGroupRepository.delete(charsGroupId);
    }

    if (categoryWithCharacteristics.characteristics.length) {
      const charsIds = [];

      categoryWithCharacteristics.characteristics.forEach((char) =>
        charsIds.push(char.id),
      );

      this.characteristicRepository.delete(charsIds);
    }
  }
}
