import { MigrationInterface, QueryRunner } from 'typeorm';

export class task321AddOrderIdForLiqpayColumn1666976552124
  implements MigrationInterface {
  name = 'task321AddOrderIdForLiqpayColumn1666976552124';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "orderIdForLiqpay" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.dropColumn('orders', 'orderIdForLiqpay');
  }
}
