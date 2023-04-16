import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class RequestColorsPicturesDto {
  @ApiProperty({ required: true })
  @IsArray()
  @IsNotEmpty()
  colors: string[];
}
