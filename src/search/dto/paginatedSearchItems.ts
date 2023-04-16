import { Product } from 'src/product/product.entity';
import { Category } from 'src/category/category.entity';
import { User } from 'src/user/user.entity';

export class PaginatedSearchItemsDto {
  data: Product[] | Category[] | User[];
  count: number;
  totalPages: number;
}
