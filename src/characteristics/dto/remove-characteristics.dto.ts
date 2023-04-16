import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveCharacteristicsDto {
  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  characteristicGroupIDs: number[];

  @ApiProperty({ type: [Number], required: false })
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  characteristicIDs: number[];
}
