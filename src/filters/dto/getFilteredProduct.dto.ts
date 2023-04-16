import { FilterGroupDto } from './filter-group.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PriceRangeDto } from './price-range.dto';
import { SortingEnum } from './sorting.enum';
import { enumValidationMessage } from '../../utils/custom-validation';

export class GetFilteredProductDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsOptional()
  categoryKey: string;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PriceRangeDto)
  priceRange: PriceRangeDto;

  @ApiProperty({ type: () => [FilterGroupDto], required: true })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => FilterGroupDto)
  @IsOptional()
  filtersGroup: FilterGroupDto[];

  @ApiProperty({ required: false })
  @IsNotEmpty()
  @IsOptional()
  @IsEnum(SortingEnum, {
    message: enumValidationMessage,
  })
  sorting: SortingEnum;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  take: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  skip: number;
}
