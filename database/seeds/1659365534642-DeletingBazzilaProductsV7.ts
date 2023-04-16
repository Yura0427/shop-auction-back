import { MigrationInterface, QueryRunner, getRepository } from 'typeorm';
import { CharacteristicValue } from '../../src/characteristics-values/characteristics-values.entity';
import { ProductToOrder } from '../../src/product-to-order/product-to-order.entity';
import { Comment } from './../../src/comments/comments.entity';
import { Product } from '../../src/product/product.entity';
import { Rating } from './../../src/ratings/ratings.entity';
import { Order } from '../../src/orders/orders.entity';
import { File } from '../../src/files/files.entity';
import { Like } from './../../src/likes/like.entity';
import * as BPromise from 'bluebird';
import * as fs from 'fs';

export class DeletingBazzilaProductsV71659365534642
  implements MigrationInterface {
  characteristicsValuesRepository = getRepository(CharacteristicValue, 'seeds');
  productToOrderRepository = getRepository(ProductToOrder, 'seeds');
  commentRepository = getRepository(Comment, 'seeds');
  productRepository = getRepository(Product, 'seeds');
  ratingRepository = getRepository(Rating, 'seeds');
  orderRepository = getRepository(Order, 'seeds');
  filesRepository = getRepository(File, 'seeds');
  likeRepository = getRepository(Like, 'seeds');

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      var allBazzillaId = await this.productRepository
        .find({
          where: {
            shopKey: 'bazzillaId',
          },
        })
        .then((arr) => arr.map((item) => item.id));

      if (!allBazzillaId.length) return;

      allBazzillaId.sort((a, b) => {
        return a - b;
      });

      const allBazzillaIdChunk = this.makeChunks(allBazzillaId, 50);

      await BPromise.map(allBazzillaIdChunk, async (chunk) => {
        const allCharacteristicsValuesId = await this.characteristicsValuesRepository
          .createQueryBuilder('characteristicsValues')
          .leftJoinAndSelect('characteristicsValues.product', 'product')
          .select('characteristicsValues.id')
          .where('characteristicsValues.product.id IN (:...chunk)', {
            chunk,
          })
          .getMany()
          .then((arr) => arr.map((item) => item.id));

        if (allCharacteristicsValuesId.length) {
          await this.characteristicsValuesRepository.delete(
            allCharacteristicsValuesId,
          );
        }
      });

      await BPromise.map(allBazzillaIdChunk, async (chunk) => {
        const orderIdRelatedProduct = await queryRunner
          .query(
            `SELECT "orderId" FROM product_to_order WHERE "productId" IN (${chunk});`,
          )
          .then((arr) => arr.map((item) => item.orderId));

        const orderIdWithoutRepeat = orderIdRelatedProduct.reduce(
          (acc: Array<number>, item: number) => {
            if (acc.includes(item)) return acc;
            return [...acc, item];
          },
          [],
        );

        if (orderIdWithoutRepeat.length) {
          const productRelatedOrder = await queryRunner
            .query(
              `SELECT id FROM product_to_order WHERE "orderId" IN (${orderIdWithoutRepeat});`,
            )
            .then((arr) => arr.map((item) => item.id));

          const productRelatedOrderChunk = this.makeChunks(
            productRelatedOrder,
            50,
          );

          await BPromise.map(productRelatedOrderChunk, async (chunk) => {
            await this.productToOrderRepository.delete(chunk);
          });

          const orderIdWithoutRepeatChunk = this.makeChunks(
            orderIdWithoutRepeat,
            50,
          );

          await BPromise.map(orderIdWithoutRepeatChunk, async (chunk) => {
            await this.orderRepository.delete(chunk);
          });
        }
      });

      await BPromise.map(allBazzillaIdChunk, async (chunk) => {
        const allLikeId = await queryRunner
          .query(`SELECT id FROM likes WHERE "productId" IN (${chunk});`)
          .then((arrOfIdObj) => arrOfIdObj.map((idObj) => idObj.id));

        if (allLikeId.length) {
          const allLikeIdChunk = this.makeChunks(allLikeId, 50);

          await BPromise.map(allLikeIdChunk, async (chunk) => {
            await this.likeRepository.delete(chunk);
          });
        }
      });

      await BPromise.map(allBazzillaIdChunk, async (chunk) => {
        const allCommentId = await queryRunner
          .query(`SELECT id FROM comment WHERE "productId" IN (${chunk});`)
          .then((arrOfIdObj) => arrOfIdObj.map((idObj) => idObj.id));

        if (allCommentId.length) {
          const allCommentIdChunk = this.makeChunks(allCommentId, 50);

          await BPromise.map(allCommentIdChunk, async (chunk) => {
            this.commentRepository.delete(chunk);
          });
        }
      });

      await BPromise.map(allBazzillaIdChunk, async (chunk) => {
        const allRatingId = await queryRunner
          .query(`SELECT id FROM ratings WHERE "productId" IN (${chunk})`)
          .then((arr) => arr.map((item) => item.id));

        if (allRatingId.length) {
          const allRatingIdChunk = this.makeChunks(allRatingId, 50);

          await BPromise.map(allRatingIdChunk, async (chunk) => {
            await this.ratingRepository.delete(chunk);
          });
        }
      });

      await BPromise.map(allBazzillaIdChunk, async (chunk) => {
        await this.productRepository.delete(chunk);
      });
    } catch (error) {
      console.log(error);
      fs.writeFile(
        './../uploads/BAZZILLA_PRODUCT_ID',
        JSON.stringify(allBazzillaId),
        (err) => console.log(err),
      );
    }
  }

  private makeChunks(arr, value) {
    const result = [];

    for (let i = 0; i < arr.length; i += value) {
      const chunk = arr.slice(i, i + value);
      result.push(chunk);
    }

    return result;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
