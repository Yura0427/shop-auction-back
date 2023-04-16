import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty } from 'class-validator';

export class InvoiceDateRangeDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsDate()
  startDate: Date;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsDate()
  endDate: Date;
}
