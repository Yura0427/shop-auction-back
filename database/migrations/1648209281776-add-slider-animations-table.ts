import { MigrationInterface, QueryRunner } from 'typeorm';

export class addSliderAnimationsTable1648209281776
  implements MigrationInterface {
  name = 'addSliderAnimationsTable1648209281776';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "slider_animation" ("id" SERIAL NOT NULL, "animation" character varying NOT NULL, "active" boolean NOT NULL, UNIQUE ("animation"), PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "slider_animation"`);
  }
}
