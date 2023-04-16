import { getRepository, MigrationInterface } from 'typeorm';
import { ParserSettings } from 'src/shop-parser/parserSettings.entity';
import { Parameters } from '../../src/parameters/parameters.entity';
import { ParametersNameEnum } from '../../src/parameters/parameters.enum';
import { IParameter } from '../../src/interfaces/parameter.interface';

export class AddLetsShopParameters1672965446598
  implements MigrationInterface {
  parametersRepository = getRepository(Parameters, 'seeds');

  public async up(): Promise<void> {
    const parameter = await this.parametersRepository.findOne({
      name: ParametersNameEnum.parser,
    });

    const params: IParameter = {
      name: ParametersNameEnum.parser,
      settings: {
        letsShop: {
          createNewProducts: true,
          updateOldProducts: true,
          updatePhoto: false,
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
