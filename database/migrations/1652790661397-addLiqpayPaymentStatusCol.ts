import { MigrationInterface, QueryRunner } from 'typeorm';

export class addLiqpayPaymentStatusCol1652790661397
  implements MigrationInterface {
  name = 'addLiqpayPaymentStatusCol1652790661397';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "liqpayPaymentStatus" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "liqpayPaymentStatus"`,
    );
  }
}
