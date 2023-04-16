import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class GetColororsPicturesDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  colorName: string;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  colorId: string[];

  @ApiProperty()
  @IsArray()
  colorFile: string[];

  @ApiProperty()
  @IsString()
  @MaxLength(7)
  hexColor: string;
}
