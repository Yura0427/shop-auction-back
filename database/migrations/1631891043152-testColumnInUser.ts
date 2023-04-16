import {MigrationInterface, QueryRunner} from "typeorm";

export class testColumnInUser1631891043152 implements MigrationInterface {
    name = 'testColumnInUser1631891043152'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."users" ADD "testColumn" character varying NOT NULL DEFAULT 'Test Value'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."users" DROP COLUMN "testColumn"`);
    }

}
