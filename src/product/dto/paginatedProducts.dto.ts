import { Product } from '../product.entity';

export class PaginatedProductsDto {
  data: Product[];
  count: number;
  totalPages: number;
}

export class PaginatedAdminProductsDto {
  data: Product[];
  count: number;
  totalPages: number;
  priceRange?: number[];
}
