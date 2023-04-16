import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateColororsPicturesDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  colorName: string;

  @ApiProperty({ required: true })
  @IsArray()
  @IsNotEmpty()
  colorId: string[];

  @ApiProperty()
  @IsArray()
  colorFile?: string[];

  @IsString()
  hexColor?: string;
}
