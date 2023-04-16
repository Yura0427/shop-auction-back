import { IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteCharacteristicValueDto {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  characteristicValuesIds: number[]
}
