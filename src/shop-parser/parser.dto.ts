import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class ParserDto {
  @ApiProperty({
    name: 'update',
    description: 'Ключ який вказує на необхідність оновлення старих товарів',
    required: false,
    type: 'boolean'
  })
  @IsOptional()
  update: boolean;

  @ApiProperty({
    name: 'key',
    description: 'Для оновлення окремого товара треба передати його key',
    required: false,
    type: 'string'
  })
  key: string;
}
