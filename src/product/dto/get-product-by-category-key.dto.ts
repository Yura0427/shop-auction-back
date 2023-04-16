import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetProductByCategoryKeyDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  take: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  skip: number;
}
