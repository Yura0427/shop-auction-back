import {MigrationInterface, QueryRunner} from "typeorm";

export class addAmountWithoutDiscountColum1679766344713 implements MigrationInterface {
    name = 'addAmountWithoutDiscountColum1679766344713'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_to_order" ADD "amountWithoutDiscount" integer`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "amountWithoutDiscount" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_to_order" DROP COLUMN "amountWithoutDiscount"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "amountWithoutDiscount"`);
    }

}
