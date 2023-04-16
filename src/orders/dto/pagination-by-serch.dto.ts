import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class paginationBySearchDTO {
  @ApiProperty()
  @IsNotEmpty()
  page: number;

  @ApiProperty()
  @IsNotEmpty()
  limit: number;
  
  @ApiProperty()
  @IsNotEmpty()
  searchValue: string;
}
