import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class UpdateProductInOrderDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  value: string;
  
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  field: string;
  
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  productToOrderId: number;
  
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  orderId: number;
}
