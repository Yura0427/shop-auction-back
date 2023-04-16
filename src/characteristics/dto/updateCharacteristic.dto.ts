import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { CharacteristicTypes } from '../characteristics.enum';
import { enumValidationMessage } from '../../utils/custom-validation';

export class updateCharacteristicDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description: string;

  @IsEnum(CharacteristicTypes, {
    message: enumValidationMessage
  })
  @IsNotEmpty()
  @IsOptional()
  type: CharacteristicTypes;

  @IsOptional()
  @IsNotEmpty()
  defaultValues: JSON;

  @IsNumber()
  @IsOptional()
  @IsNotEmpty()
  minValue: number;

  @IsNumber()
  @IsOptional()
  @IsNotEmpty()
  maxValue: number;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  categoryId: number;
}
