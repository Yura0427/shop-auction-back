import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateRatingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  public rating: number;
}
