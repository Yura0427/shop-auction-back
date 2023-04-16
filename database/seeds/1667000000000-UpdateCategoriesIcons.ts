import {
  IsNull,
  getRepository,
  In,
  MigrationInterface,
  QueryRunner,
} from 'typeorm';
import { Category } from '../../src/category/category.entity';
import { File } from '../../src/files/files.entity';
import { Storage } from '@google-cloud/storage';
import * as path from 'path';

export class UpdateCategoriesIcons1667000000000 implements MigrationInterface {
  categoryRepository = getRepository(Category, 'seeds');
  fileRepository = getRepository(File, 'seeds');
  googleStorage = new Storage({
    keyFilename: path.join(__dirname, '../../../storage-key.json'),
    projectId: process.env.GOOGLE_BUCKET_PROJECT,
  });

  bucket = this.googleStorage.bucket(process.env.GOOGLE_BUCKET);

  public async up(queryRunner: QueryRunner): Promise<void> {

    const categoriesWithoutIcon = await this.categoryRepository.find({
      where: {
        icon: IsNull(),
      },
    });

    for (const category of categoriesWithoutIcon) {
      const fileName = `${category.key}.svg`;
      const isExists = await this.bucket.file(`static/uploads/${fileName}`).exists()
      isExists && await this.fileRepository.save({ name: fileName, category });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
