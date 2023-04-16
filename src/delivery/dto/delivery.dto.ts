import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeliveryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  areaName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cityName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cityFullName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cityRef: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  streetName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  streetRef: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deliveryMethod: string;
  
  @ApiProperty()
  courierDeliveryAddress: string;
}
