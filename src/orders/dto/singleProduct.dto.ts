import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SingleProductDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  color: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  size: string;
}
