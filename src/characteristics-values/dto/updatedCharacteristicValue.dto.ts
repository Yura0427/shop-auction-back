import {
  IsArray, IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class UpdatedCharacteristicValueDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({required: false})
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  @ApiProperty({required: false})
  @IsOptional()
  // @IsNotEmpty()
  @IsString()
  stringValue: string;

  @ApiProperty({required: false})
  @IsOptional()
  // @IsNotEmpty()
  @IsNumber()
  numberValue: number;

  @ApiProperty({required: false})
  @IsOptional()
  // @IsNotEmpty()
  @IsArray()
  enumValue: string[] | number[];

  @ApiProperty({required: false})
  @IsOptional()
  // @IsNotEmpty()
  @IsBoolean()
  booleanValue: boolean;

  @ApiProperty({required: false})
  @IsOptional()
  // @IsNotEmpty()
  jsonValue: JSON;

  @ApiProperty({required: false})
  @IsOptional()
  // @IsNotEmpty()
  // @IsDate()
  dateValue: Date;

  @ApiProperty({required: false})
  @IsOptional()
  // @IsNotEmpty()
  rangeValue: string[];

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @IsNotEmpty()
  characteristicId: number;
}
