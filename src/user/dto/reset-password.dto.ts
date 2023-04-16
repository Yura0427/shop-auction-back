import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Match } from '../match.decorator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  newPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @Match('newPassword', { message: 'Пароль повинен співпадати' })
  @IsString()
  confirmPassword: string;
}
