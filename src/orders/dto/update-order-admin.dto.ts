import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateOrderAdminDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  @IsOptional()
  quantity: number;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  size: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  color: string;
}
