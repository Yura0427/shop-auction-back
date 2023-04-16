import {MigrationInterface, QueryRunner} from "typeorm";

export class removeTestColumnInUser1631893530024 implements MigrationInterface {
    name = 'removeTestColumnInUser1631893530024'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."users" DROP COLUMN "testColumn"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."users" ADD "testColumn" character varying NOT NULL DEFAULT 'Test Value'`);
    }

}
