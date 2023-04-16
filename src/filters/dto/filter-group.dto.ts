import { CharacteristicTypes } from '../../characteristics/characteristics.enum';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { enumValidationMessage } from '../../utils/custom-validation';
import { ApiProperty } from '@nestjs/swagger';

export class FilterGroupDto {
  @ApiProperty({ required: true })
  @IsNumber()
  @IsNotEmpty()
  characteristicId: number;

  @ApiProperty({ required: false })
  @IsString()
  characteristicName: string;
  

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEnum(CharacteristicTypes, {
    message: enumValidationMessage,
  })
  type: CharacteristicTypes;

  @ApiProperty({ example: ['синій', 'червоний'], required: true })
  @IsArray()
  @IsNotEmpty()
  values: Array<string | number>;
}
