import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeUrlFromInvoice1659859772003 implements MigrationInterface {
  name = 'removeUrlFromInvoice1659859772003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "url"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(`ALTER TABLE "invoices" ADD "url" character varying`);
  }
}
