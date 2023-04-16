import { getRepository, MigrationInterface } from 'typeorm';
import { ParserSettings } from 'src/shop-parser/parserSettings.entity';

export class AddLetsShopParserParameters1671725624022
  implements MigrationInterface {
  parserSettingsRepository = getRepository(ParserSettings, 'seeds');

  public async up(): Promise<void> {
    await this.parserSettingsRepository.find({
      parserName: 'letsShop',
    });

    const params = {
      parserName: 'letsShop',
      parserStatus: 'STOP',
      lastMessage: '',
    };

    await this.parserSettingsRepository.save(params);
  }

  public async down(): Promise<void> {
    const params = await this.parserSettingsRepository.find({
      parserName: 'letsShop',
    });

    if (params) {
      await this.parserSettingsRepository.remove(params);
    }
  }
}
