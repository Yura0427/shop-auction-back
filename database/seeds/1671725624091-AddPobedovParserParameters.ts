import { getRepository, MigrationInterface } from 'typeorm';
import { ParserSettings } from 'src/shop-parser/parserSettings.entity';

export class AddPobedovParserParameters1671725624091
  implements MigrationInterface {
  parserSettingsRepository = getRepository(ParserSettings, 'seeds');

  public async up(): Promise<void> {
    await this.parserSettingsRepository.find({
      parserName: 'pobedov',
    });

    const params = {
      parserName: 'pobedov',
      parserStatus: 'STOP',
      lastMessage: '',
    };

    await this.parserSettingsRepository.save(params);
  }

  public async down(): Promise<void> {
    const params = await this.parserSettingsRepository.find({
      parserName: 'pobedov',
    });

    if (params) {
      await this.parserSettingsRepository.remove(params);
    }
  }
}
