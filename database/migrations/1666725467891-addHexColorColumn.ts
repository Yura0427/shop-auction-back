import { MigrationInterface, QueryRunner } from 'typeorm';

export class addHexColorColumn1666725467891 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "colorsPicturesFiles" ADD "hexColor" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "colorsPicturesFiles" DROP COLUMN "hexColor"`,
    );
  }
}
