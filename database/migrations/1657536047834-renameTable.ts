import { MigrationInterface, QueryRunner } from 'typeorm';

export class renameTable1657536047834 implements MigrationInterface {
  name?: string;
  down(queryRunner: QueryRunner): Promise<any> {
    throw new Error('Method not implemented.');
  }
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      ` DO $$
        BEGIN
            IF EXISTS(SELECT *
                FROM information_schema.columns
                WHERE table_name='users' and column_name='winerDate')
            THEN
                ALTER TABLE "users" RENAME COLUMN "winerDate" TO "winnerDate";
            END IF;
        END $$;`,
    );
  }
}
