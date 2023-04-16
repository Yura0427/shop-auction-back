import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CallbackDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  data: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  signature: string;
}
