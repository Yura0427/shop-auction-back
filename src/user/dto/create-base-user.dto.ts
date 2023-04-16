import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Match } from '../match.decorator';
import { Role } from '../role/role.entity';

export class CreateBaseUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Match('password', { message: 'Пароль повинен співпадати' })
  confirmPassword: string;

  role: Role;
}
