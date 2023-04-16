import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Product } from '../product/product.entity';
import { Repository } from 'typeorm';
import { Category } from '../category/category.entity';
import { GetFilteredProductDto } from './dto/getFilteredProduct.dto';
import { Characteristic } from '../characteristics/characteristics.entity';
import { CharacteristicValue } from '../characteristics-values/characteristics-values.entity';
import { CharacteristicTypes } from '../characteristics/characteristics.enum';
import { FilterGroupDto } from './dto/filter-group.dto';
import { rawResult } from './rawResult';
import { filterResult } from './filtersResult';
import { SortingEnum } from './dto/sorting.enum';

@Injectable()
export class FiltersService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Characteristic)
    private characteristicRepository: Repository<Characteristic>,
    @InjectRepository(CharacteristicValue)
    private characteristicValueRepository: Repository<CharacteristicValue>,
  ) {}

  async getFilteredProducts(
    dto: GetFilteredProductDto,
  ): Promise<{ product: Product[]; count: number }> {
    const { filtersGroup, priceRange, categoryKey, sorting, take, skip } = dto;

    if (!Object.keys(dto).length) {
      throw new BadRequestException(
        'Запит повинен мати мінімум 1 ключ filtersGroup або priceRange',
      );
    }

    if (filtersGroup && !filtersGroup.length) {
      throw new BadRequestException(
        "Ви не переделаи жодного об'єкта фільтра у тілі запиту",
      );
    }

    // const makeQuery = (group: FilterGroupDto) => {
    //   switch (group.type) {
    //     case CharacteristicTypes.ENUM:
    //       const stringifyValues = group.values.map((value) => `'${value}'`);
    //       return `INNER JOIN "characteristicsValues" cv${group.characteristicId}
    //                   ON p.id = cv${group.characteristicId}."productId"
    //                   AND ((cv${group.characteristicId}."characteristicId" = '${group.characteristicId}')
    //                   AND (string_to_array(cv${group.characteristicId}."enumValue", ',') && array [${stringifyValues}]))`;
    //     case CharacteristicTypes.BOOLEAN:
    //       return `INNER JOIN "characteristicsValues" cv${group.characteristicId}
    //                   ON p.id = cv${group.characteristicId}."productId"
    //                   AND ((cv${group.characteristicId}."characteristicId" = '${group.characteristicId}')
    //                   AND (cv${group.characteristicId}."booleanValue" = (${group.values[0]})))`;
    //     case CharacteristicTypes.STRING:
    //       let str = '';
    //       group.values[0]
    //         .toString()
    //         .split(',')
    //         .forEach(
    //           (el) =>
    //             (str =
    //               str === ''
    //                 ? str +
    //                   ` AND (cv${group.characteristicId}."stringValue" = '${el}')`
    //                 : str.split('').slice(0, str.indexOf(')')).join('') +
    //                   ` OR cv${group.characteristicId}."stringValue" = '${el}')`),
    //         );
    //       return (
    //         `INNER JOIN "characteristicsValues" cv${group.characteristicId}
    //              ON p.id = cv${group.characteristicId}."productId"
    //              AND ((cv${group.characteristicId}."characteristicId" = '${group.characteristicId}'))` +
    //         str
    //       );
    //   }
    // };

    // let findConditions = '';

    // if (filtersGroup) {
    //   const groupQuery = filtersGroup.map((group) => {
    //     return makeQuery(group);
    //   });
    //   findConditions = groupQuery.join(' ');
    // }

    // const select = `SELECT pr.id AS pr_id, pr."createdAt" as pr_createdAt, pr."updatedAt" as pr_updatedAt,
    //     pr.name AS pr_name, pr.description AS pr_description, pr.key AS pr_key, pr.url as pr_url,
    //     pr.price AS pr_price, pr."avgRating" as pr_avgRating, pr."availability" as pr_availability,
    //     pr."categoryId" AS pr_categoryid, ct.key AS pr_subCategoryKey, ct.id AS pr_subCategoryId,
    //     f.id AS pr_mainImgId, f.name AS pr_mainImgName, cvM.id AS cv_id, cvM.name AS cv_name,
    //     cvM.type AS cv_type, cvM."booleanValue" AS cv_booleanValue, cvM."dateValue" AS cv_dateValue,
    //     cvM."enumValue" AS cv_enumValue, cvM."jsonValue" AS cv_jsonValue, cvM."numberValue" AS cv_numberValue,
    //     cvM."characteristicId" AS cv_characteristicId, cvM."stringValue" AS cv_stringValue,
    //     comm.id AS comm_id, comm.text AS comm_text,comm."authorId" AS comm_authorId, comm."productId" AS comm_productId
    // `;

    //     const priceQuery = priceRange
    //       ? `AND (p.price BETWEEN ${priceRange.min} AND ${priceRange.max}) `
    //       : '';

    //     let sortingQuery = 'ORDER BY p."availability" DESC, p."avgRating" DESC';
    //     switch (sorting) {
    //       case SortingEnum.priceDesc:
    //         sortingQuery = 'ORDER BY p."availability" DESC, p.price DESC';
    //         break;
    //       case SortingEnum.priceAsc:
    //         sortingQuery = 'ORDER BY p."availability" DESC, p.price ASC';
    //         break;
    //       case SortingEnum.newArrivals:
    //         sortingQuery = 'ORDER BY p."availability" DESC, p."createdAt" DESC';
    //         break;
    //       case SortingEnum.popularity:
    //         sortingQuery = 'ORDER BY p."availability" DESC, p."avgRating" DESC';
    //         break;
    //     }

    //     let query: string;

    //     if (filtersGroup) {
    //       query = `${select} FROM products pr
    //                     LEFT JOIN "comment" comm ON pr.id = comm."productId"
    //                     LEFT JOIN "files" f ON pr."mainImgId" = f.id
    //                     LEFT JOIN categories ct on pr."categoryId" = ct.id
    //                     LEFT OUTER JOIN "characteristicsValues" cvM ON pr.id = cvM."productId"
    //                     WHERE pr.id IN (
    //                     SELECT p.id
    //                     FROM products p ${findConditions}
    //                     AND p."disabled" = false
    //                     ${priceQuery}
    //                     ${sortingQuery}
    //                     LIMIT ${take} offset ${skip})
    //                     `;
    //     } else {
    //       query = `${select} FROM products pr
    //                     LEFT JOIN "comment" comm ON pr.id = comm."productId"
    //                     LEFT JOIN "files" f ON pr."mainImgId" = f.id
    //                     LEFT JOIN categories ct on pr."categoryId" = ct.id
    //                     LEFT OUTER JOIN "characteristicsValues" cvM ON pr.id = cvM."productId"
    //                     WHERE pr.id IN (
    //                     SELECT p.id
    //                     FROM products p
    //                     where p."disabled" = false AND p."categoryId" = (select categories."id" from categories where categories.key = '${categoryKey}')
    //                     ${priceQuery}
    //                     ${sortingQuery}
    //                     LIMIT ${take} offset ${skip})
    //                     `;
    //     }

    //     const products: rawResult[] = await this.productRepository.query(query);

    //     const duplicateFinder = (item: rawResult, array: filterResult[]) => {
    //       return array.findIndex((i) => i.id === item.pr_id);
    //     };

    //     const resultBuilder = (rawResult: rawResult[]): filterResult[] => {
    //       const filteredResult: filterResult[] = [];

    //       rawResult.forEach((item) => {
    //         const {
    //           pr_id,
    //           pr_createdat,
    //           pr_updatedat,
    //           pr_name,
    //           pr_price,
    //           pr_avgrating,
    //           pr_availability,
    //           pr_categoryid,
    //           pr_subcategoryid,
    //           pr_subcategorykey,
    //           pr_key,
    //           pr_url,
    //           pr_description,
    //           pr_mainimgid,
    //           pr_mainimgname,
    //           cv_id,
    //           cv_name,
    //           cv_characteristicid,
    //           cv_type,
    //           cv_stringvalue,
    //           cv_numbervalue,
    //           cv_enumvalue,
    //           cv_booleanvalue,
    //           cv_jsonvalue,
    //           cv_datevalue,
    //           comm_id,
    //           comm_text,
    //           comm_authorid,
    //           comm_productid,
    //         } = item;

    //         const charValue = {
    //           id: cv_id,
    //           name: cv_name,
    //           type: cv_type,
    //           characteristicId: cv_characteristicid,
    //           stringValue: cv_stringvalue,
    //           numberValue: cv_numbervalue,
    //           enumValue: cv_enumvalue && cv_enumvalue.split(','),
    //           booleanValue: cv_booleanvalue,
    //           jsonValue: cv_jsonvalue,
    //           dateValue: cv_datevalue,
    //         };

    //         const comments = {
    //           id: comm_id,
    //           text: comm_text,
    //           authorId: comm_authorid,
    //           productId: comm_productid,
    //         };

    //         const newCharValue = {
    //           id: pr_id,
    //           createdAt: pr_createdat,
    //           updatedAt: pr_updatedat,
    //           name: pr_name,
    //           price: pr_price,
    //           availability: pr_availability,
    //           avgRating: pr_avgrating,
    //           categoryId: pr_categoryid,
    //           category: {
    //             id: pr_subcategoryid,
    //             key: pr_subcategorykey,
    //           },
    //           key: pr_key,
    //           url: pr_url,
    //           description: pr_description,
    //           mainImg: pr_mainimgid
    //             ? {
    //                 id: pr_mainimgid,
    //                 name: pr_mainimgname,
    //               }
    //             : null,
    //           characteristicValue: [charValue],
    //           comments: [],
    //         };

    //         const findIndex = duplicateFinder(item, filteredResult);

    //         if (findIndex !== -1) {
    //           filteredResult[findIndex].characteristicValue.push(charValue);
    //           if (
    //             comments.id &&
    //             !filteredResult[findIndex].comments.find(
    //               (el) => el.id === comments.id,
    //             )
    //           ) {
    //             filteredResult[findIndex].comments.push(comments);
    //           }
    //         } else filteredResult.push(newCharValue);
    //       });

    //       switch (sorting) {
    //         case SortingEnum.priceDesc:
    //           filteredResult.sort((a, b) => b.price - a.price);
    //           break;
    //         case SortingEnum.priceAsc:
    //           filteredResult.sort((a, b) => a.price - b.price);
    //           break;
    //         case SortingEnum.popularity:
    //           filteredResult.sort((a, b) => +b.avgRating - +a.avgRating);
    //           break;
    //         case SortingEnum.newArrivals:
    //           filteredResult.sort(
    //             (a, b) =>
    //               new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    //           );
    //           break;
    //       }

    //       return filteredResult.sort((a, b) => {
    //         return a.availability === b.availability ? 0 : a.availability ? -1 : 1;
    //       });
    //     };

    //     return resultBuilder(products);

    let query = this.productRepository
      .createQueryBuilder('products')
      .leftJoin('products.mainImg', 'files')
      .addSelect(['files.id', 'files.name'])
      .leftJoin('products.comments', 'comment')
      .addSelect([
        'comment.id',
        'comment.text',
        'comment.authorId',
        'comment.productId',
      ])
      .orderBy('products.availability', 'DESC');

    let sort = 'products.avgRating';
    let order: 'DESC' | 'ASC' = 'DESC';

    if (priceRange) {
      query = query.andWhere(
        'products.price >= :minPrice AND products.price <= :maxPrice',
        { minPrice: priceRange.min, maxPrice: priceRange.max },
      );
    }

    switch (sorting) {
      case SortingEnum.priceDesc:
        sort = 'products.price';
        order = 'DESC';
        break;
      case SortingEnum.priceAsc:
        sort = 'products.price';
        order = 'ASC';
        break;
      case SortingEnum.newArrivals:
        sort = 'products.createdAt';
        order = 'DESC';
        break;
      case SortingEnum.popularity:
        sort = 'products.avgRating';
        order = 'DESC';
        break;
    }

    query = !categoryKey
      ? query
          .innerJoin('products.category', 'categories')
          .addSelect(['categories.id', 'categories.key'])
      : query
          .innerJoin(
            'products.category',
            'categories',
            'categories.key = :categoryKey',
            { categoryKey },
          )
          .addSelect(['categories.id', 'categories.key']);

    if (filtersGroup) {
      for (let i = 0; i < filtersGroup.length; i++) {
        const filter = filtersGroup[i];
        query = query
          .innerJoin(
            'products.characteristicValue',
            `characteristicsValues${i}`,
            `characteristicsValues${i}.name = :characteristicName${i} AND characteristicsValues${i}.stringValue IN (:...stringValue${i})`,
            {
              [`characteristicName${i}`]: filter.characteristicName,
              [`stringValue${i}`]: filter.values.toString().split(','),
            },
          )
          .addSelect([
            `characteristicsValues${i}.id`,
            `characteristicsValues${i}.name`,
            `characteristicsValues${i}.type`,
            `characteristicsValues${i}.characteristicId`,
            `characteristicsValues${i}.stringValue`,
            `characteristicsValues${i}.numberValue`,
            `characteristicsValues${i}.enumValue`,
            `characteristicsValues${i}.booleanValue`,
            `characteristicsValues${i}.jsonValue`,
            `characteristicsValues${i}.dateValue`,
          ]);
      }
    } else {
      query = query
        .innerJoin('products.characteristicValue', 'characteristicsValues')
        .addSelect([
          'characteristicsValues.id',
          'characteristicsValues.name',
          'characteristicsValues.type',
          'characteristicsValues.characteristicId',
          'characteristicsValues.stringValue',
          'characteristicsValues.numberValue',
          'characteristicsValues.enumValue',
          'characteristicsValues.booleanValue',
          'characteristicsValues.jsonValue',
          'characteristicsValues.dateValue',
        ]);
    }

    const [filtredProduct, count] = await query
      .addOrderBy(sort, order)
      .take(take)
      .skip(skip)
      .getManyAndCount();

    return { product: filtredProduct, count };
  }
}
