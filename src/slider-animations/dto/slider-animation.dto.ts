import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty } from 'class-validator';

export class SliderAnimationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  animation: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  active: boolean;
}
