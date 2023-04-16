import { MigrationInterface, QueryRunner } from 'typeorm';

export class paymentOrderStatus1667990089624 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "paymentStatus"  boolean NOT NULL DEFAULT false;
      UPDATE "orders" SET "paymentStatus"=true WHERE "liqpayPaymentStatus"='success';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.dropColumn('orders', 'paymentStatus');
  }
}
