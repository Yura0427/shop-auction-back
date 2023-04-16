import { Category } from './category.entity';

export class TreeCategory extends Category {
  children: Category[];
}
