import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PaginationDto } from '@shared/pagination.dto';

export class QueryPropertiesDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  products: string;

  @ApiProperty({ required: false })
  @IsOptional()
  categories: string;

  @ApiProperty({ required: false })
  @IsOptional()
  users: string;
}
