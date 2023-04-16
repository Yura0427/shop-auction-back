import {
  getRepository,
  MigrationInterface,
  QueryRunner,
  Repository,
} from 'typeorm';
import { Parameters } from '../../src/parameters/parameters.entity';

export class t636AddSizePrioritySettings1677605588736
  implements MigrationInterface {
  private parametersRepository: Repository<Parameters>;
  public parameterName: string;

  constructor() {
    this.parametersRepository = getRepository(Parameters, 'seeds');
    this.parameterName = 'size-priority';
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const parameter = await this.parametersRepository.findOne({
      where: { name: this.parameterName },
    });

    if (!parameter) {
      await this.parametersRepository.save({
        name: this.parameterName,
        settings: JSON.stringify({ L: '' }),
      });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const params = await this.parametersRepository.find({
      where: { name: this.parameterName },
    });

    if (params.length > 0) {
      const paramIds = params.map((param) => param.id);
      await this.parametersRepository.delete(paramIds);
    }
  }
}
