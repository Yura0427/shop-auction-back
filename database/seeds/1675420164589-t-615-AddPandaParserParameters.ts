import { getRepository, MigrationInterface, QueryRunner } from 'typeorm';
import { IParameter } from '../../src/interfaces/parameter.interface';
import { Parameters } from '../../src/parameters/parameters.entity';
import { ParametersNameEnum } from '../../src/parameters/parameters.enum';
import { EParserStatus } from 'src/shop-parser/utils/parserStatus.enum';
import { ParserSettings } from '../../src/shop-parser/parserSettings.entity';

export class t615AddPandaParserParameters1675420164589
  implements MigrationInterface {
  parametersRepository = getRepository(Parameters, 'seeds');
  parserSettingsRepository = getRepository(ParserSettings, 'seeds');

  public async up(): Promise<void> {
    const newParserParams: IParameter = {
      name: ParametersNameEnum.parser,
      settings: {
        panda: {
          updatePhoto: false,
          createNewProducts: true,
          updateOldProducts: true,
          updateOldCharacteristics: true,
        },
      },
    };

    const parserParameters = await this.parametersRepository.findOne({
      name: ParametersNameEnum.parser,
    });

    if (parserParameters) {
      const oldSettings = parserParameters.settings as any;
      const updatedParams = {
        name: ParametersNameEnum.parser,
        settings: { ...oldSettings, ...newParserParams.settings },
      };

      await this.parametersRepository.update(
        parserParameters.id,
        updatedParams,
      );
    } else {
      await this.parametersRepository.save(newParserParams);
    }

    const pandaParameters = {
      parserName: 'panda',
      parserStatus: EParserStatus.stopped,
    };

    await this.parserSettingsRepository.save(pandaParameters);
  }

  public async down(): Promise<void> {
    const parserParameters = await this.parametersRepository.findOne({
      name: ParametersNameEnum.parser,
    });

    delete parserParameters.settings['panda'];

    await this.parametersRepository.save(parserParameters);
    await this.parserSettingsRepository.delete({ parserName: 'panda' });
  }
}
