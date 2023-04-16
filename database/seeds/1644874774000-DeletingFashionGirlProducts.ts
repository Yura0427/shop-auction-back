import { getRepository, In, MigrationInterface, QueryRunner } from 'typeorm';
import { Product } from '../../src/product/product.entity';
import { File } from '../../src/files/files.entity';
import * as BlueBirdPromise from 'bluebird';
import { ProductToOrder } from '../../src/product-to-order/product-to-order.entity';
import { Order } from '../../src/orders/orders.entity';
import { CharacteristicValue } from '../../src/characteristics-values/characteristics-values.entity';
import { Storage } from '@google-cloud/storage';
import * as path from 'path';

export class DeletingFashionGirlProducts1644874774000
  implements MigrationInterface {
  productRepository = getRepository(Product, 'seeds');
  productToOrderRepository = getRepository(ProductToOrder, 'seeds');
  orderRepository = getRepository(Order, 'seeds');
  filesRepository = getRepository(File, 'seeds');
  characteristicsValuesRepository = getRepository(CharacteristicValue, 'seeds');
  googleStorage = new Storage({
    keyFilename: path.join(__dirname, '../../../storage-key.json'),
    projectId: process.env.GOOGLE_BUCKET_PROJECT,
  });

  bucket = this.googleStorage.bucket(process.env.GOOGLE_BUCKET);

  async deleteFromStorage(fileNames: string[]) {
    await BlueBirdPromise.map(
      fileNames,
      async (fileName) => {
        await this.bucket
          .file(`static/uploads/${fileName}`)
          .delete();
      },
      { concurrency: 10 },
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(process.env.POSTGRES_HOST);
    console.log('process.env.POSTGRES_HOST');
    if (process.env.POSTGRES_HOST !== '49.12.97.190') {
      return;
    }
    const allProductsFG = await this.productRepository.find({
      where: {
        shopKey: 'fashionGirl',
      },
    });

    const productsIds = allProductsFG.map((product) => product.id);

    if (!productsIds.length) return;

    const allFilesByIds = await this.filesRepository
      .createQueryBuilder('files')
      .leftJoinAndSelect('files.product', 'product')
      .where('files.product.id IN (:...productsIds)', { productsIds })
      .getMany();

    const allCharacteristicsValuesByIds = await this.characteristicsValuesRepository
      .createQueryBuilder('characteristicsValues')
      .leftJoinAndSelect('characteristicsValues.product', 'product')
      .select('characteristicsValues.id')
      .where('characteristicsValues.product.id IN (:...productsIds)', {
        productsIds,
      })
      .getMany();

    const characteristicsValuesIds = allCharacteristicsValuesByIds.map(
      (x) => x.id,
    );

    if (characteristicsValuesIds.length) {
      await this.characteristicsValuesRepository.delete(
        characteristicsValuesIds,
      );
    }

    const allProductsToOrderByIds = await this.productToOrderRepository
      .createQueryBuilder('product_to_order')
      .leftJoinAndSelect('product_to_order.product', 'product')
      .leftJoinAndSelect('product_to_order.order', 'order')
      .where('product_to_order.product.id IN (:...productsIds)', {
        productsIds,
      })
      .getMany();
    const ordersIds = allProductsToOrderByIds.map((x) => x.order.id);

    if (ordersIds.length) {
      const allProductsToOrderByOrdersIds = await this.productToOrderRepository
        .createQueryBuilder('product_to_order')
        .leftJoinAndSelect('product_to_order.order', 'order')
        .where('product_to_order.order.id IN (:...ordersIds)', {
          ordersIds,
        })
        .getMany();

      const productsToOrderIds = allProductsToOrderByOrdersIds.map((x) => x.id);
      if (productsToOrderIds.length) {
        await this.productToOrderRepository.delete(productsToOrderIds);
      }

      await this.orderRepository.delete(ordersIds);
    }

    await this.productRepository.delete(productsIds);
    const imagesUrls = allFilesByIds.map((file) => file.name);
    if (imagesUrls) await this.deleteFromStorage(imagesUrls);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
