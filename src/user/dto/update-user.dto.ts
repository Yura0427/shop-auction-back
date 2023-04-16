import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsPhoneNumber,
  IsOptional,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { UserRoleEnum } from '../user.enum';
import { enumValidationMessage } from '../../utils/custom-validation';
import { Role } from '../role/role.entity';

export class UpdateUserDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsPhoneNumber('UA', {message: "Невалідний номер телефону"})
  phoneNumber: string;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  dateOfBirth: Date;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  roleId: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  newPassword: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  confirmNewPassword: string;
}
