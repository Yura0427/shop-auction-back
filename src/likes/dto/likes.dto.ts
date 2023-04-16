import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class LikesDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  productId: number;
}
