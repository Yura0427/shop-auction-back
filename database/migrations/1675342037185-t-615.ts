import { MigrationInterface, QueryRunner } from 'typeorm';

export class t6151675342037185 implements MigrationInterface {
  name = 't6151675342037185';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "parserSettings" ADD "lastError" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "parserSettings" ADD "lastParsedProduct" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "parserSettings" ADD "errorStatus" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "parserSettings" DROP COLUMN "errorStatus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parserSettings" DROP COLUMN "lastParsedProduct"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parserSettings" DROP COLUMN "lastError"`,
    );
  }
}
