import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UploadImageDto {
  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  productId: number;
}
