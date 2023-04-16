import { getRepository, MigrationInterface, QueryRunner } from 'typeorm';
import { IParameter } from '../../src/interfaces/parameter.interface';
import { Parameters } from '../../src/parameters/parameters.entity';
import { ParametersNameEnum } from '../../src/parameters/parameters.enum';
import { ParserSettings } from '../../src/shop-parser/parserSettings.entity';
import { EParserStatus } from '../../src/shop-parser/utils/parserStatus.enum';

export class AddWhiteMandarinparser1678738640900 implements MigrationInterface {
  parametersRepository = getRepository(Parameters, 'seeds');
  parserSettingsRepository = getRepository(ParserSettings, 'seeds');

  public async up(queryRunner: QueryRunner): Promise<void> {
    const newParserParams: IParameter = {
      name: ParametersNameEnum.parser,
      settings: {
        whiteMandarin: {
          createNewProducts: true,
          updateOldProducts: true,
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

    const whiteMandarinParameters = {
      parserName: 'whiteMandarin',
      parserStatus: EParserStatus.stopped,
    };

    await this.parserSettingsRepository.save(whiteMandarinParameters);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const parserParameters = await this.parametersRepository.findOne({
      name: ParametersNameEnum.parser,
    });

    delete parserParameters.settings['whiteMandarin'];

    await this.parametersRepository.save(parserParameters);
    await this.parserSettingsRepository.delete({ parserName: 'whiteMandarin' });
  }
}
