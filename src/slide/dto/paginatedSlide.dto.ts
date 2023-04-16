import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsPositive, IsString } from 'class-validator';
import { Slide } from '../slide.entity';

export class PaginatedSlideDtoRes {
  @ApiProperty({
    name: 'data',
    description: 'Масив слайдів',
    required: true,
    type: 'array',
  })
  data: Slide[];

  @ApiProperty({
    name: 'count',
    description: 'Загальна кількість слайдів',
    required: true,
    type: 'number',
  })
  count: number;

  @ApiProperty({
    name: 'totalPages',
    description:
      'Кількість сторінок(вираховується шляхом ділення загальної кількості слайдів на кількість слайдів на сторінці)',
    required: true,
    type: 'number',
  })
  totalPages: number;

  @ApiProperty({
    name: 'page',
    description: 'Поточна сторінка ',
    required: true,
    type: 'number',
  })
  page: number;
}

export class PaginatedSlideDtoReq {
  @ApiProperty({
    name: 'page',
    description:
      'Задає сторінку пагінації яка буде відправлена на запит. Дефолтне значення - 1',
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsPositive()
  page: number;

  @ApiProperty({
    name: 'limit',
    description:
      'Обмеження для пагінації. Задає кількість слайдів на одну сторінку. Дефолтне значення - 10',
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsPositive()
  limit: number;

  @ApiProperty({
    name: 'sort',
    description:
      'Задає стовпець таблиці для сортування. Можливі значення: id, priority. Дефолтне значення - id',
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @IsIn(['id', 'priority'])
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
