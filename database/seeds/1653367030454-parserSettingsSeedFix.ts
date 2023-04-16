import { getRepository, MigrationInterface } from 'typeorm';
import { Parameters } from '../../src/parameters/parameters.entity';
import { ParametersNameEnum } from '../../src/parameters/parameters.enum';
import { IParameter } from '../../src/interfaces/parameter.interface';

export class parserSettingsSeedFix1653367030454 implements MigrationInterface {
  parametersRepository = getRepository(Parameters, 'seeds');

  public async up(): Promise<void> {
    const parameter = await this.parametersRepository.findOne({
      name: ParametersNameEnum.parser,
    });

    if (parameter) {
      const params: IParameter = {
        name: ParametersNameEnum.parser,
        settings: {
          bazzillaId: { createNewProducts: true, updatePhoto: false },
          fashionGirl: { createNewProducts: true, updatePhoto: false },
        },
      };

      await this.parametersRepository.update(parameter.id, params);
    }
  }

  public async down(): Promise<void> {
    const params = await this.parametersRepository.findOne({
      name: ParametersNameEnum.parser,
    });

    if (params) {
      await this.parametersRepository.remove(params);
    }
  }
}
