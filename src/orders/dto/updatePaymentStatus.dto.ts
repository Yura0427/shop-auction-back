import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

import { Status } from '../orderStatus.enum';

export class UpdatePaymentStatusDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsBoolean()
  paymentStatus: boolean;
}
