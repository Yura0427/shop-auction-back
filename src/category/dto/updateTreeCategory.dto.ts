import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CharacteristicGroupsDto } from '../../characteristic-group/dto/characteristicGroups.dto';
import { Type } from 'class-transformer';
import { RemoveCharacteristicsDto } from '../../characteristics/dto/remove-characteristics.dto';

export class UpdateTreeCategoryDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  key: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  parentCategory: number;

  @ApiProperty({ type: () => [CharacteristicGroupsDto], required: false })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CharacteristicGroupsDto)
  characteristicGroups: CharacteristicGroupsDto[];

  @ApiProperty({ type: () => RemoveCharacteristicsDto, required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RemoveCharacteristicsDto)
  removedCharacteristics: RemoveCharacteristicsDto;
}
