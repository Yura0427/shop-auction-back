import { getRepository, MigrationInterface, QueryRunner } from 'typeorm';
import { Parameters } from '../../src/parameters/parameters.entity';
import { ParametersNameEnum } from '../../src/parameters/parameters.enum';
import { ParserSettings } from '../../src/shop-parser/parserSettings.entity';

export class DeletePandaParserSettings1678739477683
  implements MigrationInterface {
  parametersRepository = getRepository(Parameters, 'seeds');
  parserSettingsRepository = getRepository(ParserSettings, 'seeds');

  public async up(queryRunner: QueryRunner): Promise<void> {
    const parserParameters = await this.parametersRepository.findOne({
      name: ParametersNameEnum.parser,
    });

    delete parserParameters.settings['panda'];

    const updatedParameters = {
      name: ParametersNameEnum.parser,
      settings: { ...(parserParameters.settings as any) },
    };

    await this.parametersRepository.update(
      parserParameters.id,
      updatedParameters,
    );

    const parserSettings = await this.parserSettingsRepository.findOne({
      parserName: 'panda',
    });

    if (parserSettings) {
      await this.parserSettingsRepository.delete(parserSettings);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
