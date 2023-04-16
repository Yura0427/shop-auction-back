import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProductDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  discountedPrice: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  categoryId: number;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  availability: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  disabled: boolean;
}
