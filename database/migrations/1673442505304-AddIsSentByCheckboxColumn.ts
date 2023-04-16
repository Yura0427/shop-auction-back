import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIsSentByCheckboxColumn1673442505304 implements MigrationInterface {
    name = 'AddIsSentByCheckboxColumn1673442505304'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ADD "isSentByCheckbox" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "isSentByCheckbox"`);
    }
}
