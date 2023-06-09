import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ required: true })
  @IsNumber()
  @IsNotEmpty()
  productId: number;
}
