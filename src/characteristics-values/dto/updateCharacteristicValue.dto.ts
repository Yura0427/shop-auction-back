import {
  IsNotEmpty,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { UpdatedCharacteristicValueDto } from './updatedCharacteristicValue.dto';


export class UpdateCharacteristicValueDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({type: () => [UpdatedCharacteristicValueDto]})
  @IsNotEmpty()
  @ValidateNested({each: true})
  @Type(() => UpdatedCharacteristicValueDto)
  characteristicValues: UpdatedCharacteristicValueDto[];
}
