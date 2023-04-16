import { MigrationInterface, QueryRunner } from 'typeorm';

export class task2381653473267280 implements MigrationInterface {
  name = 'task2381653473267280';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "disabled" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "disabled"`);
  }
}
