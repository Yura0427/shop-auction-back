import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class P2PPaymentDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  amount: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  currency: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  card: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  cardExpMonth: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  cardExpYear: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  cardCVV: string;
}
