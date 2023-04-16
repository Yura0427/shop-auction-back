import { MigrationInterface, getRepository } from 'typeorm';
import { Parameters } from '../../src/parameters/parameters.entity';
import { ParametersNameEnum } from '../../src/parameters/parameters.enum';
import { IParameter } from '../../src/interfaces/parameter.interface';

export class addDrawSettingsSeed1675085141282 implements MigrationInterface {
  parametersRepository = getRepository(Parameters, 'seeds');
  public async up(): Promise<void> {
    const parameter = await this.parametersRepository.findOne({
      name: ParametersNameEnum.draw,
    });
    const params: IParameter = {
      name: ParametersNameEnum.draw,
      settings: {
        enable: false,
      },
    };
    if (parameter) {
      await this.parametersRepository.update(parameter.id, params);
    } else {
      await this.parametersRepository.save(params);
    }
  }

  public async down(): Promise<void> {
    const params = await this.parametersRepository.findOne({
      name: ParametersNameEnum.draw,
    });

    if (params) {
      await this.parametersRepository.remove(params);
    }
  }
}
