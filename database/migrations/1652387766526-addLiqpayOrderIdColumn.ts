import { MigrationInterface, QueryRunner } from 'typeorm';

export class addLiqpayOrderIdColumn1652387221585 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(
      `ALTER TABLE "orders" ADD "liqpayOrderId" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.dropColumn('orders', 'liqpayOrderId');
  }
}
