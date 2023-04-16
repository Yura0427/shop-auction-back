import { Order } from '../orders.entity';

export class PaginatedOrdersDto {
  data: Order[];
  count: number;
  totalPages: number;
}
