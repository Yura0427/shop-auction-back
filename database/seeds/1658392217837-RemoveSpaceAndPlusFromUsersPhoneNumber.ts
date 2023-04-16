import { MigrationInterface, QueryRunner } from 'typeorm';
import * as BPromise from 'bluebird';

type usersRow = {
  id: number;
  phoneNumber: string;
};

export class RemoveSpaceAndPlusFromUsersPhoneNumber1658392217837
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const usersRows = await queryRunner.query(
      'SELECT id, "phoneNumber" FROM users;',
    );

    await BPromise.map(usersRows, async (row: usersRow) => {
      if (!row.phoneNumber) return;
      await this.setNewNumber(queryRunner, row);
    });
  }

  private async setNewNumber(queryRunner: QueryRunner, row: usersRow) {
    const newNumber = this.removeSpacesAndPlus(row.phoneNumber);
    await queryRunner.query(
      `UPDATE users SET "phoneNumber" = ${newNumber} WHERE id = ${row.id};`,
    );
  }

  private removeSpacesAndPlus(phoneNumber: string): string {
    return phoneNumber.replace(/\D/g, '');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const usersRows = await queryRunner.query(
      'SELECT id, "phoneNumber" FROM users;',
    );

    await BPromise.map(usersRows, async (row: usersRow) => {
      if (!row.phoneNumber) return;
      await this.setOldNumber(queryRunner, row);
    });
  }

  private async setOldNumber(queryRunner: QueryRunner, row: usersRow) {
    const oldNumber = this.addSpacesAndPlus(row.phoneNumber);

    await queryRunner.query(
      `UPDATE users SET "phoneNumber" = '${oldNumber}' WHERE id = ${row.id};`,
    );
  }

  private addSpacesAndPlus(phoneNumber: string): string {
    const numbers = phoneNumber.split('');
    const result = ['+', ...numbers];
    result.splice(4, 0, ' ');
    result.splice(7, 0, ' ');
    result.splice(11, 0, ' ');
    result.splice(14, 0, ' ');
    return result.join('');
  }
}
