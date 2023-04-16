import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsPhoneNumber, IsOptional, Matches, IsNotEmpty } from 'class-validator';
import { CreateBaseUserDto } from './create-base-user.dto';

export class CreateUserDto extends CreateBaseUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-ZА-Яа-яёЁЇїІіЄєҐґ ]+$/)
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-ZА-Яа-яёЁЇїІіЄєҐґ ]+$/)
  lastName: string;

  @ApiProperty()
  @IsOptional()
  @IsPhoneNumber('UA', { message: 'Недійсний номер телефону' })
  phoneNumber: string;
}
