import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Match } from '../match.decorator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  newPassword: string;

  @ApiProperty()
  @Match('newPassword', { message: 'Пароль повинен співпадати' })
  @IsString()
  confirmNewPassword: string;
}
