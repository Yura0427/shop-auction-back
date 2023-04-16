import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { Role } from '../role/role.entity';

export class CreateCutUserDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPhoneNumber('UA', { message: 'Недійсний номер телефону' })
  phoneNumber: string;

  @ApiProperty()
  @IsOptional()
  @IsEmail()
  email: string | null;

  role: Role;
}
