import {MigrationInterface, QueryRunner} from "typeorm";

export class task3001644327383170 implements MigrationInterface {
    name = 'task3001644327383170'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "delivery" ADD COLUMN "courierDeliveryAddress" character varying, ADD COLUMN "deliveryMethod" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "delivery" DROP "courierDeliveryAddress", DROP "deliveryMethod"`);
    }

}
