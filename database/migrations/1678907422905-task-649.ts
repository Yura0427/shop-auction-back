import {MigrationInterface, QueryRunner} from "typeorm";

export class task6491678907422905 implements MigrationInterface {
    name = 'task6491678907422905'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "discountedPrice" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "discountedPrice"`);
    }

}
