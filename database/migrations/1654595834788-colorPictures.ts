import { MigrationInterface, QueryRunner } from 'typeorm';

export class colorPictures1654595834788 implements MigrationInterface {
  name = 'colorPictures1654595834788';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "colorsPicturesFiles" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "colorName" character varying NOT NULL, "colorId" text[] NOT NULL, "colorFile" text[], PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "colorsPicturesFiles"`);
  }
}
