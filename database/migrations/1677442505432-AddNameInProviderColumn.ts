import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIsSentByCheckboxColumn1673442505304 implements MigrationInterface {
    name = 'AddNameInProviderColumn1677442505432'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "nameInProvider" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "nameInProvider"`);
    }
}
