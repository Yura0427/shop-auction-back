import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class deleteColumnDisabledByAdminFromTableCategory1681231429008
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('categories');

    if (table) {
      await queryRunner.dropColumn(table, 'disabledByAdmin');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('categories');

    if (table) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'disabledByAdmin',
          type: 'boolean',
          default: false,
        }),
      );
    }
  }
}
