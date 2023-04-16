import {
    getRepository,
    ILike,
    IsNull,
    MigrationInterface,
    QueryRunner,
    Raw,
  } from 'typeorm';
  import * as BlueBirdPromise from 'bluebird';
  
  import { Product } from '../../src/product/product.entity';
  import { File } from '../../src/files/files.entity';
  import {
    getTotalPages,
    takeSkipCalculator,
  } from '../../src/utils/get-total-pages';
  import {
    characteristicsToDesc,
    clearName,
  } from '../../src/shop-parser/utils/parser-utils';
  
  export class disableUselessProducts1632921207361 implements MigrationInterface {
    productRepository = getRepository(Product, 'default');
    filesRepository = getRepository(File, 'default');
  
    async roundPrice(count: number, limit: number) {
      const totalPages = getTotalPages(count, limit, 0);
      const pageArr = new Array(totalPages);
  
      await BlueBirdPromise.mapSeries(pageArr, async () => {
        const products = await this.productRepository.find({
          where: {
            price: Raw((alias) => `(${alias} % 5) > 0`),
          },
          take: limit,
        });
  
        const updatedProducts = products.map((product) => ({
          ...product,
          price: Math.ceil(product.price / 5) * 5,
        }));
  
        await this.productRepository.save(updatedProducts);
      });
    }
  
    async disableProductsWithOnePhoto(limit: number) {
      const countQuery = `
        select count(*) from (
          select f."productId" as productId, count(f."productId") as filesCount
          from files f
          group by productId
          having count(f."productId") = 2
        )
        as productCount`;
  
      const [{ count }] = await this.filesRepository.query(countQuery);
  
      const totalPages = getTotalPages(count, limit, 0);
      const pageArr = new Array(totalPages);
  
      await BlueBirdPromise.mapSeries(pageArr, async (page, i) => {
        const { skip } = takeSkipCalculator(100, i + 1);
        const productsQuery = `
          select * from products pr
          where pr.id in (
            select product.productId
            from (
                select f."productId" as productId, count(f."productId") as filesCount
                from files f
                group by productId
                having count(f."productId") = 2
                limit ${limit}
                offset ${skip}
            )
            as product)
            and pr.disabled = false`;
  
        const products = await this.productRepository.query(productsQuery);
  
        const disabledProducts = products.map((product) => ({
          ...product,
          disabled: true,
        }));
        await this.productRepository.save(disabledProducts);
      });
    }
  
    async filterName(limit: number) {
      const [result, count] = await this.productRepository.findAndCount({
        where: {
          name: ILike('%YuLiYa%'),
        },
        take: 1,
      });
  
      const totalPages = getTotalPages(count, limit, 0);
      const pageArr = new Array(totalPages);
  
      await BlueBirdPromise.mapSeries(pageArr, async () => {
        const products = await this.productRepository.find({
          where: {
            name: ILike('%YuLiYa%'),
          },
          take: limit,
        });
  
        const disallowedWords: string[] = [
          'отYuLiYa Chumachenko',
          'от YuLiYa Chumachenko',
          'от YuLiYaChumachenko',
          // the last symbol "o" is in Cyrillic
          'от YuLiYa Chumachenkо',
        ];
  
        const filteredProducts = products.map((product) => ({
          ...product,
          name: clearName(product.name, disallowedWords),
        }));
        await this.productRepository.save(filteredProducts);
      });
    }
  
    async installMainImg() {
      const result = await this.productRepository.find({
        where: {
          mainImg: IsNull(),
        },
        relations: ['files'],
      });
  
      for (const product of result) {
        const files = product.files.filter(
          (item) => !item.name.includes('cropped'),
        );
        if (files.length) {
          await this.productRepository.save({
            ...product,
            mainImg: files[0],
          });
        } else {
          await this.productRepository.save({
            ...product,
            disabled: true,
          });
        }
      }
    }
  
    async transformCharsToDesc(limit: number) {
      const [result, count] = await this.productRepository.findAndCount({
        where: {
          description: Raw((alias) => `length(${alias}) < 60`),
          disabled: false,
        },
        take: 1,
      });
  
      const totalPages = getTotalPages(count, limit, 1);
      const pageArr = new Array(totalPages);
  
      await BlueBirdPromise.mapSeries(pageArr, async () => {
        const products = await this.productRepository.find({
          where: {
            description: Raw((alias) => `length(${alias}) < 60`),
            disabled: false,
          },
          relations: ['characteristicValue'],
          take: limit,
        });
  
        const productToDisable = [];
  
        const filteredProducts = products.filter((item) => {
          if (!item.characteristicValue.length) {
            productToDisable.push({ ...item, disabled: true });
          }
          return item.characteristicValue.length;
        });
  
        const updatedProducts = filteredProducts.map((item) => {
          const newDesc = characteristicsToDesc(item.characteristicValue);
          const newProduct = { ...item };
  
          if (newDesc.length < 60) {
            newProduct.disabled = true;
          } else {
            newProduct.description = newDesc;
          }
  
          return newProduct;
        });
  
        await this.productRepository.save([
          ...productToDisable,
          ...updatedProducts,
        ]);
      });
    }
  
    public async up(queryRunner: QueryRunner): Promise<void> {
      try {
        const testReq = await this.productRepository.find();
      } catch (e) {
        return;
      }
  
      const limit = 100;
      const [products, countForPrice] = await this.productRepository.findAndCount(
        {
          where: {
            price: Raw((alias) => `(${alias} % 5) > 0`),
          },
          take: 10,
          skip: 0,
        },
      );
      await this.roundPrice(countForPrice, limit);
  
      await this.disableProductsWithOnePhoto(100);
  
      await this.filterName(limit);
  
      await this.installMainImg();
  
      await this.transformCharsToDesc(limit);
    }
  
    public async down(queryRunner: QueryRunner): Promise<void> {}
  }