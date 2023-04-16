import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CharacteristicValueDto } from './characteristicValue.dto';

export class CreateCharacteristicValueDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  noValidate: boolean;

  @ApiProperty({ type: () => [CharacteristicValueDto] })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CharacteristicValueDto)
  characteristicValues: CharacteristicValueDto[];
}
