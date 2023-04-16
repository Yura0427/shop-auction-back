import { DeliveryDto } from '../../delivery/dto/delivery.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsBoolean,
} from 'class-validator';

export class ToPendingDto extends DeliveryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  additionalFirstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  additionalLastName: string;

  @ApiProperty()
  @IsOptional()
  @IsPhoneNumber('UA')
  @IsOptional()
  additionalNumber: string;

  @ApiProperty()
  @IsOptional()
  @IsEmail()
  @IsOptional()
  additionalEmail: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  comment: string;
  
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @IsOptional()
  notcall: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;
}
