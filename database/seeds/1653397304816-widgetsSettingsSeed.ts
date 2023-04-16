import { getRepository, MigrationInterface } from 'typeorm';
import { Parameters } from '../../src/parameters/parameters.entity';
import { ParametersNameEnum } from '../../src/parameters/parameters.enum';
import { IParameter } from '../../src/interfaces/parameter.interface';

export class widgetsSettingsSeed1653397304816 implements MigrationInterface {
  parametersRepository = getRepository(Parameters, 'seeds');

  public async up(): Promise<void> {
    const parameter = await this.parametersRepository.findOne({
      name: ParametersNameEnum.widgets,
    });

    const params: IParameter = {
      name: ParametersNameEnum.widgets,
      settings: {
        newArrivals: { quantity: 4, isWidgetActive: false },
        popularItems: { quantity: 4, isWidgetActive: false },
      },
    };

    if (parameter) {
      await this.parametersRepository.update(parameter.id, params);
    } else {
      await this.parametersRepository.save(params);
    }


  }

  public async down(): Promise<void> {
    const params = await this.parametersRepository.findOne({
      name: ParametersNameEnum.widgets,
    });

    if (params) {
      await this.parametersRepository.remove(params);
    }
  }
}
