import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

import { CharacteristicTypes } from '../characteristics.enum';
import { enumValidationMessage } from '../../utils/custom-validation';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCharacteristicDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  id: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  required: boolean;

  @ApiProperty({ required: false })
  @IsEnum(CharacteristicTypes, {
    message: enumValidationMessage,
  })
  @IsNotEmpty()
  @IsOptional()
  type: CharacteristicTypes;

  @ApiProperty({ required: false, example: { values: [0, 1, 2] } })
  @IsOptional()
  defaultValues: JSON;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  minValue: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  maxValue: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsNotEmpty()
  groupId: number;
}
