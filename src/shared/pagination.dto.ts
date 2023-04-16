import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsPositive, IsString } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    name: 'page',
    description: 'Задає сторінку пагінації яка буде відправлена на запит. Дефолтне значення - 1',
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsPositive()
  page: number;

  @ApiProperty({
    name: 'limit',
    description:
      'Обмеження для пагінації. Задає кількість товарів на одну сторінку. Дефолтне значення - 10',
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsPositive()
  limit: number;

  @ApiProperty({
    name: 'sort',
    description:
      'Задає стовпець таблиці для сортування. Можливі значення: id, createdAt, phoneNumber, firstName.  Дефолтне значення - id',
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @IsIn(['id', 'createdAt', 'phoneNumber', 'firstName'])
  sort: string;

  @ApiProperty({
    name: 'sortDirect',
    description:
      'Задає напрямок сортування. Від більшог до меньшого (asc) або від меньшого до більшого(desc).  Дефолтне значення - asc',
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortDirect: string;
}
