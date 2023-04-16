import { IParameter } from 'src/interfaces/parameter.interface';
import { Parameters } from 'src/parameters/parameters.entity';
import { ParametersNameEnum } from 'src/parameters/parameters.enum';
import { getRepository, MigrationInterface } from 'typeorm';

export class PobedovParserSettingsSeed1671440740388
  implements MigrationInterface {
  parametersRepository = getRepository(Parameters, 'seeds');

  public async up(): Promise<void> {
    const parameter = await this.parametersRepository.findOne({
      name: ParametersNameEnum.parser,
    });

    const params: IParameter = {
      name: ParametersNameEnum.parser,
      settings: {
        pobedov: {
          createNewProducts: true,
          updateOldProducts: true,
          updatePhoto: false,
          parserLimit: 10,
        },
      },
    };

    if (parameter) {
      const settings = parameter.settings as any;
      const objectForSave = {
        name: params.name,
        settings: { ...settings, ...params.settings },
      };
      await this.parametersRepository.update(parameter.id, objectForSave);
    } else {
      await this.parametersRepository.save(params);
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
