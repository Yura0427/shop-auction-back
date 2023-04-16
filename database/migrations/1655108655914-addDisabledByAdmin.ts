import {MigrationInterface, QueryRunner} from "typeorm";

export class addDisabledByAdmin1655108655914 implements MigrationInterface {
    name = 'addDisabledByAdmin1655108655914'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" ADD "disabledByAdmin" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "disabledByAdmin"`);
    }

}
