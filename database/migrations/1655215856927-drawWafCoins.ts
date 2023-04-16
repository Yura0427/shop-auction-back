import { MigrationInterface, QueryRunner } from 'typeorm';

export class drawWafCoins1655215856927 implements MigrationInterface {
  name = 'drawWafCoins1655215856927';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "wafCoins" NUMERIC(6,2)`);
    await queryRunner.query(`ALTER TABLE "users" ADD "winnerDate" Date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP "wafCoins"`);
    await queryRunner.query(`ALTER TABLE "users" DROP "winnerDate"`);
  }
}
