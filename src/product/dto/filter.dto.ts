import { ApiProperty } from '@nestjs/swagger';
import { FindOperator } from 'typeorm';
import { CharacteristicValue } from '../../characteristics-values/characteristics-values.entity';

export class FilterDto {
  @ApiProperty()
  id?: number | FindOperator<number>;

  @ApiProperty()
  name?: FindOperator<string>;

  @ApiProperty()
  key?: FindOperator<string>;

  @ApiProperty()
  shopKey?: FindOperator<string>;

  @ApiProperty()
  category?: {
    name: FindOperator<string>;
  };

  @ApiProperty()
  price?: FindOperator<string>;
  characteristicValue?: { jsonValue: any };
}
