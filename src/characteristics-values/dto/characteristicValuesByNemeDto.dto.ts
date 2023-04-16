import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class characteristicValuesByNameQeq {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
export class characteristicValuesByNameRes {
  characteristicsValues_stringValue: string;
}
