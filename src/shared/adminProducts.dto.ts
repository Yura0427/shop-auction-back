import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsPositive, IsString } from 'class-validator';

export class AdminProductsDto {
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
      'Задає стовпець таблиці для сортування. Можливі значення: id, name, price, description, category, createdAt, updatedAt, shopKey.  Дефолтне значення - id',
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'id',
    'name',
    'price',
    'description',
    'category',
    'createdAt',
    'updatedAt',
    'shopKey',
  ])
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

  @ApiProperty({
    name: 'filterId',
    description: 'Задає значення фільтра для пошуку товару по його id',
    required: false,
    type: 'number',
  })
  @IsOptional()
  filterId: number;

  @ApiProperty({
    name: 'filterName',
    description:
      'Задає значення фільтра для пошуку товарів в назві яких є передане значення',
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  filterName: string;

  @ApiProperty({
    name: 'filterCategory',
    description:
      'Задає значення фільтра для пошуку товарів в категорії яких є передане значення',
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  filterCategory: string;

  @ApiProperty({
    name: 'filterPrice',
    description:
      'Задає значення фільтра для пошуку товарів за вказаним діапазоном ціни. Передається значення розділені комою.',
    required: false,
    type: 'string',
  })
  filterPrice: string;

  @ApiProperty({
    name: 'filterShop',
    description:
      'Задає значення фільтра для пошуку товарів за назвою магазина.',
    required: false,
    type: 'string',
  })
  filterShop: string;

  @ApiProperty({
    name: 'filterSize',
    description:
      'Задає значення фільтра для пошуку товарів за наявністю розміру',
    required: false,
    type: 'string',
  })
  filterSize: string;
}
