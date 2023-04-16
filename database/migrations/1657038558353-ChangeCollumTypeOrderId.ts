import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeCollumTypeOrderId1655993030029
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(
      'ALTER TABLE orders ALTER COLUMN id SET DATA TYPE bigint;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(
      'ALTER TABLE orders ALTER COLUMN id SET DATA TYPE integer;',
    );
  }
}
