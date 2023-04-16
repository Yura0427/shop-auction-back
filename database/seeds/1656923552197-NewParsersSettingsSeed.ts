import { getRepository, MigrationInterface } from 'typeorm';
import { Parameters } from '../../src/parameters/parameters.entity';
import { ParametersNameEnum } from '../../src/parameters/parameters.enum';
import { IParameter } from '../../src/interfaces/parameter.interface';

export class NewParsersSettingsSeed1656923552197 implements MigrationInterface {
  parametersRepository = getRepository(Parameters, 'seeds');

  public async up(): Promise<void> {
    const parameter = await this.parametersRepository.findOne({
      name: ParametersNameEnum.parser,
    });

    const params: IParameter = {
      name: ParametersNameEnum.parser,
      settings: {
        olla: { updateOldCharacteristics: true },
        fashionGirl: { updateOldCharacteristics: true },
      },
    };

    if (parameter) {
      const settings = parameter.settings as any
      const objectForSave = {
        name: params.name,
        settings: {
          ...settings, 
          olla: { ...settings.olla, ...params.settings.olla},
          fashionGirl: { ...settings.fashionGirl, ...params.settings.fashionGirl},
        }}
      await this.parametersRepository.update(parameter.id, objectForSave);
    }
  }

  public async down(): Promise<void> {
    const params = await this.parametersRepository.find({
      name: ParametersNameEnum.parser,
    });

    if (params) {
      await this.parametersRepository.remove(params);
    }
  }
}
