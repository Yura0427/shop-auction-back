import {MigrationInterface, QueryRunner} from "typeorm";

export class sizeColorInOrder1635172078987 implements MigrationInterface {
    name = 'sizeColorInOrder1635172078987'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."product_to_order" ADD "size" character varying`);
        await queryRunner.query(`ALTER TABLE "public"."product_to_order" ADD "color" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."product_to_order" DROP COLUMN "color"`);
        await queryRunner.query(`ALTER TABLE "public"."product_to_order" DROP COLUMN "size"`);
    }

}
