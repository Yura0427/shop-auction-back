import { getRepository, MigrationInterface } from 'typeorm';
import { ParserSettings } from 'src/shop-parser/parserSettings.entity';

export class AddOllaParserParameters1662965446598 implements MigrationInterface {
  parserSettingsRepository = getRepository(ParserSettings, 'seeds');

  public async up(): Promise<void> {
    const parameter = await this.parserSettingsRepository.find({
      parserName: 'olla',
    });

    const params = {
        parserName: 'olla',
        parserStatus: 'STOP',
        lastMessage: '',
    };

    await this.parserSettingsRepository.save(params);
  }

  public async down(): Promise<void> {
    const params = await this.parserSettingsRepository.find({
      parserName: 'olla',
    });

    if (params) {
      await this.parserSettingsRepository.remove(params);
    }
  }
}
