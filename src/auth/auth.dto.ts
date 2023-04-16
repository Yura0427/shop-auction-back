import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class AuthDto {
  @ApiProperty()
  @IsNotEmpty() 
  @IsEmail()
  public email: string;

  @ApiProperty()
  @IsNotEmpty() 
  @IsString()
  public password: string;
}

export class VerifyAccountDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  public userId: number;

  @ApiProperty()
  @IsNotEmpty() 
  @IsString()
  public token: string;
}
