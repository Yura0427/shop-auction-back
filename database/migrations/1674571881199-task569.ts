import {MigrationInterface, QueryRunner} from "typeorm";

export class task5691674571881199 implements MigrationInterface {
    name = 'task5691674571881199'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_to_order" ADD "parcelNumber" varchar(254)`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_to_order" DROP COLUMN "parcelNumber"`);
    }

}
