import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderValueDto } from './order.dto';
import { SingleProductDto } from './singleProduct.dto';

export class AddOrderDto {
  @ApiProperty({ type: () => [OrderValueDto] })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => OrderValueDto)
  orderValues: OrderValueDto[];

  @ApiProperty({ type: () => SingleProductDto })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => SingleProductDto)
  singleProduct: SingleProductDto;
}
