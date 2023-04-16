import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber, IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class CreateUserThroughAdminDto {

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPhoneNumber('UA')
  phoneNumber: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  roleId: number;

  @ApiProperty()
  password: string;

  @ApiProperty()
  confirmPassword: string;

  @ApiProperty()
  @IsOptional()
  telegramId: string;
}
