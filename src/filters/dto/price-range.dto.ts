import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PriceRangeDto {
  @ApiProperty({ required: true })
  @IsNumber()
  @IsNotEmpty()
  min: number;

  @ApiProperty({ required: true })
  @IsNumber()
  @IsNotEmpty()
  max: number;
}
