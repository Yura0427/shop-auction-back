import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../product/product.entity';

export class OrderValueDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  parcelNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  product: Product;

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

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
