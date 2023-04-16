import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsBoolean } from 'class-validator';

export class DisableCategoryDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  disable: boolean;
}
