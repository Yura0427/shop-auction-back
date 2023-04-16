import { IParameter } from "src/interfaces/parameter.interface";
import { Parameters } from "src/parameters/parameters.entity";
import { ParametersNameEnum } from "src/parameters/parameters.enum";
import {getRepository, MigrationInterface} from "typeorm";

export class cashbackSettingsSeed1654277720944 implements MigrationInterface {
    parametersRepository = getRepository(Parameters, 'seeds');

    public async up(): Promise<void> {
        const parameter = await this.parametersRepository.findOne({
            name: ParametersNameEnum.cashback,
          });
      
          const params: IParameter = {
            name: ParametersNameEnum.cashback,
            settings: {
              currentCashback: { percent: 0 },
              enable: false
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
            name: ParametersNameEnum.cashback,
        });
      
        if (params) {
            await this.parametersRepository.remove(params);
        }
    }
    

}
