import { MigrationInterface, QueryRunner } from 'typeorm';
import * as BPromise from 'bluebird';

type allOrdersRows = {
  id: number;
  additionalNumber: string;
};

export class RemoveSpaceFromOrderAdditionalNumber1655923625337
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const allOrdersRows = await queryRunner.query(
      'SELECT id, "additionalNumber" FROM orders;',
    );

    BPromise.map(
      allOrdersRows,
      (item: allOrdersRows) => {
        if (!item.additionalNumber) return;
        this.setNumberWithoutSpacesAndPlus(queryRunner, item);
      },
      { concurrency: 3 },
    );
  }

  private async setNumberWithoutSpacesAndPlus(queryRunner: QueryRunner, item) {
    const newNumber = this.removeSpacesAndPlus(item.additionalNumber);
    await queryRunner.query(
      `UPDATE orders SET "additionalNumber" = ${newNumber} WHERE id = ${item.id};`,
    );
  }

  private removeSpacesAndPlus(additionalNumber: string): string {
    return additionalNumber.replace(/\D/g, '');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
