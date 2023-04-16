import {MigrationInterface, QueryRunner} from "typeorm";

export class task2981644411752472 implements MigrationInterface {
    name = 'task2981644411752472'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ADD "notcall" boolean`);
        await queryRunner.query(`ALTER TABLE "slides" ALTER COLUMN "imageMobile" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "slides" ALTER COLUMN "imageMobile" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "notcall"`);
    }

}
