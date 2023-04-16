import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateGoogleUser {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  googleId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  givenName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  familyName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
