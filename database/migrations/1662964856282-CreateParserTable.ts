import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateParserTable1662964856282 implements MigrationInterface {
  name = 'CreateParserTable1662964856282';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "parserSettings" (
        "id" SERIAL NOT NULL, 
        "parserName" TEXT NOT NULL, 
        "parserStatus" TEXT NOT NULL, 
        "lastMessage" TEXT,
        "lastStart" TIMESTAMP,
        "lastUpdate" TIMESTAMP,
        PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "parserSettings"`);
  }
}
