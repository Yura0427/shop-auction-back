import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class SendChangeEmail {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  newEmail: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;
}

export class ChangeEmailDto {
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
  email: string;
}
