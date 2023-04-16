import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateCharacteristicDto } from '../../characteristics/dto/createCharacteristic.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CharacteristicGroupsDto {
  @ApiProperty({required: false})
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  id: number;

  @ApiProperty({ type: () => [CreateCharacteristicDto], required: false })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateCharacteristicDto)
  characteristics: CreateCharacteristicDto[];
}
