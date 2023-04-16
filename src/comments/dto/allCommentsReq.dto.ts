import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsPositive, IsString } from 'class-validator';

export class allCommentsReq {
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
      'Обмеження для пагінації. Задає кількість коментарів на одну сторінку. Дефолтне значення - 10',
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsPositive()
  limit: number;

  @ApiProperty({
    name: 'sort',
    description:
      'Задає стовпець таблиці для сортування. Можливі значення: id, author, productId, createdAt, updatedAt. Дефолтне значення - id',
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @IsIn(['id', 'author', 'productId', 'createdAt', 'updatedAt'])
  sort: string;

  @ApiProperty({
    name: 'sortDirect',
    description:
      'Задає напрямок сортування. Від більшог до меньшого (asc) або від меньшого до більшого(desc). Дефолтне значення - asc',
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortDirect: 'asc' | 'desc';
}
