import { getRepository, In, MigrationInterface, QueryRunner } from 'typeorm';
import { Product } from '../../src/product/product.entity';
import { Category } from '../../src/category/category.entity';
import * as BlueBirdPromise from 'bluebird';

export class regenerateProductUrl1634115343799 implements MigrationInterface {
  productRepository = getRepository(Product, 'default');
  categoryRepository = getRepository(Category, 'default');

  async generateProductUrl(category: Category): Promise<string> {
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

    let url = '';

    ascCategoryIds.forEach((id) => {
      const related = ascCategories.find((item) => item.id === id);
      url += `/${related.key}`;
    });
    url += `/${category.key}`;

    return url;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    interface CustomResult extends Product {
      categoryId: number;
    }
    const data: Array<CustomResult> = await this.productRepository.query(
      'select * from products pr',
    );

    await BlueBirdPromise.mapSeries(data, async (item) => {
      const category = await this.categoryRepository.query(
        `select * from categories ct where ct.id = ${item.categoryId}`,
      );
      const url = await this.generateProductUrl(category[0]);

      await this.productRepository.update(item.id, { url });
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}