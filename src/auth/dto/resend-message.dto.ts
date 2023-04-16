import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
