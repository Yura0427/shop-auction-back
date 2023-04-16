import {
  IsArray, IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class CharacteristicValueDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({required: false})
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  stringValue: string;

  @ApiProperty({required: false})
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  numberValue: number;

  @ApiProperty({required: false})
  @IsOptional()
  @IsNotEmpty()
  @IsArray()
  enumValue: string[] | number[];

  @ApiProperty({required: false})
  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  booleanValue: boolean;

  @ApiProperty({required: false})
  @IsOptional()
  @IsNotEmpty()
  jsonValue: JSON;

  @ApiProperty({required: false})
  @IsOptional()
  @IsNotEmpty()
  @IsDate()
  dateValue: Date;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  characteristicId: number;
}
