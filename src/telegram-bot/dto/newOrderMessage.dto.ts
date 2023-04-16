import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class NewOrderMessageDto {
  @ApiProperty()
  @IsString()
  userName: string;

  @ApiProperty()
  numberGoods: number;

  @ApiProperty()
  orderPrice: number;

}
