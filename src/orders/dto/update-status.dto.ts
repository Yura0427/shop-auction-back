import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { Status } from '../orderStatus.enum';

export class UpdateStatusDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  status: Status;
}
