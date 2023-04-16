import { getRepository, MigrationInterface } from 'typeorm';
import { Parameters } from '../../src/parameters/parameters.entity';
import { ParametersNameEnum } from '../../src/parameters/parameters.enum';
import { IParameter } from '../../src/interfaces/parameter.interface';

export class UpdateParsersSettingsSeed1659366081955
  implements MigrationInterface {
  parametersRepository = getRepository(Parameters, 'seeds');

  public async up(): Promise<void> {
    const parameter = await this.parametersRepository.findOne({
      name: ParametersNameEnum.parser,
    });

    const params: IParameter = {
      name: ParametersNameEnum.parser,
      settings: {
        bazzillaId: { isWorks: false },
      },
    };

    if (parameter) {
      const settings = parameter.settings as any;
      const objectForSave = {
        name: params.name,
        settings: {
          ...settings,
          bazzillaId: { ...settings.bazzillaId, ...params.settings.bazzillaId },
        },
      };
      await this.parametersRepository.update(parameter.id, objectForSave);
    }
  }

  public async down(): Promise<void> {
    const parameter = await this.parametersRepository.findOne({
      name: ParametersNameEnum.parser,
    });

    if (parameter) {
      const settings = parameter.settings as any;
      delete settings.bazzillaId.isWorks;

      await this.parametersRepository.update(parameter.id, {
        name: ParametersNameEnum.parser,
        settings,
      });
    }
  }
}
