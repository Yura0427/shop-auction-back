import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  phoneNumber: string | null;

  @ApiProperty()
  @IsNumber()
  roleId: number;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  currentEmail: string;
  
  @ApiProperty()
  @IsString()
  currentPhoneNumber: string;
}
