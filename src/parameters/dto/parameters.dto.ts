import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ParametersNameEnum } from '../parameters.enum';

export class ParametersDto {
  @ApiProperty({ enum: ParametersNameEnum })
  @IsNotEmpty()
  @IsString()
  public name: ParametersNameEnum;

  @ApiProperty()
  @IsNotEmpty()
  public settings: any;
}
