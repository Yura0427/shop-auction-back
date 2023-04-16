import {MigrationInterface, QueryRunner} from "typeorm";

export class task2711634037856425 implements MigrationInterface {
    name = 'task2711634037856425'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."orders" ADD "comment" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."orders" DROP COLUMN "comment"`);
    }

}
