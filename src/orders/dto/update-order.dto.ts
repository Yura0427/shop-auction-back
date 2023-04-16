import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateOrderDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  @IsOptional()
  quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsOptional()
  orderProductId: number;

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

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  notcall: boolean;
}
