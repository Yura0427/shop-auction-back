import { MigrationInterface, QueryRunner } from 'typeorm';

export class task3221654424384149 implements MigrationInterface {
  name = 'task3221654424384149';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "invoices" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "url" character varying, "fileSize" integer, "invoiceFileId" integer, UNIQUE ("url"), UNIQUE ("invoiceFileId"), PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "invoices"`);
  }
}
