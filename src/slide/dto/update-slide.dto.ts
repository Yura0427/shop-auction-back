import { IsOptional, IsBoolean, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSlideDto {
  @ApiProperty({ type: String, format: 'binary' })
  image: string;

  @ApiProperty({ type: String, format: 'binary' })
  imageMobile: string;

  @IsOptional()
  @IsString()
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly text: string;

  @IsOptional()
  @IsString()
  readonly href: string;

  @IsOptional()
  @IsBoolean()
  readonly isShown: boolean;

  @IsOptional()
  @IsNumber()
  readonly priority: number;
}
