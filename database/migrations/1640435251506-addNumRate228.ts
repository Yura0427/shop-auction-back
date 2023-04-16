import { MigrationInterface, QueryRunner } from 'typeorm';

export class addNumRate2281640435251506 implements MigrationInterface {
  name = 'addNumRate2281640435251506';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "numRates" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "numRates"`);
  }
}
