import { getRepository, MigrationInterface, QueryRunner } from 'typeorm';
import { Parameters } from '../../src/parameters/parameters.entity';
import { ParametersNameEnum } from '../../src/parameters/parameters.enum';

export class parserSettingsSeed1645111110344 implements MigrationInterface {
    parametersRepository = getRepository(Parameters, 'seeds');

    public async up(queryRunner: QueryRunner): Promise<void> {
        const parameter = await this.parametersRepository.findOne({
            name: ParametersNameEnum.parser,
        });

        if (parameter) {
            return;
        }
        const params = {
            name: ParametersNameEnum.parser,
            settings: "{\"bazzillaId\":{\"createNewProducts\":true,\"updatePhoto\":false},\"fashionGirl\":{\"createNewProducts\":true,\"updatePhoto\":false}}"
        };

        await this.parametersRepository.save(params);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const params = await this.parametersRepository.findOne({
          name: ParametersNameEnum.parser,
        });

    if (params) {
      await this.parametersRepository.remove(params);
    }
    }
}
