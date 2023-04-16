import {MigrationInterface, QueryRunner} from "typeorm";

export class task2721655047047944 implements MigrationInterface {
    name = 'task2721655047047944'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "userWallet" NUMERIC(9,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "userWallet"`);
    }

}
