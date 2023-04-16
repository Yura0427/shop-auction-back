import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { BaseCategoryDto } from './base-category.dto';

export class CreateTreeCategoryDto extends BaseCategoryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  parentId: number;

  @ApiProperty({ required: false, type: () => [BaseCategoryDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BaseCategoryDto)
  children: BaseCategoryDto[];
}
