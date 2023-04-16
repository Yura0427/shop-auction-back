import { Entity, ManyToOne } from 'typeorm';

import { BaseEntity } from '@shared/base.entity';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';

@Entity({ name: 'likes' })
export class Like extends BaseEntity {
  @ManyToOne(() => Product, (product) => product.likes, { onDelete: 'CASCADE' })
  product: Product;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  user: User;
}
