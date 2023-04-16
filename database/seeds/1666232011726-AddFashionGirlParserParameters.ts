import { getRepository, MigrationInterface } from 'typeorm';
import { ParserSettings } from 'src/shop-parser/parserSettings.entity';

export class AddFashionGirlParserParameters1666232011726 implements MigrationInterface {
  parserSettingsRepository = getRepository(ParserSettings, 'seeds');

  public async up(): Promise<void> {
    const parameter = await this.parserSettingsRepository.findOne({
      parserName: 'fashionGirl',
    });

    const params = {
        parserName: 'fashionGirl',
        parserStatus: 'STOPPED',
        lastMessage: '',
    };

    if (parameter) {
      await this.parserSettingsRepository.update(parameter.id, params);
    } else {
      await this.parserSettingsRepository.save(params);
    }
  }

  public async down(): Promise<void> {
    const params = await this.parserSettingsRepository.find({
      parserName: 'fashionGirl',
    });

    if (params) {
      await this.parserSettingsRepository.remove(params);
    }
  }
}
