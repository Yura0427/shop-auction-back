 import {MigrationInterface, QueryRunner} from "typeorm";

export class task4461661013594295 implements MigrationInterface {
    name = 'task4461661013594295'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" ADD "iconId" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "iconId"`);
    }

}
