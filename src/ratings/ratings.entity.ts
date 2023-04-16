import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { BaseEntity } from '../shared/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity({ name: 'ratings' })
export class Rating extends BaseEntity {
  @Column()
  currentRating: number;

  @ManyToOne(() => Product, (product) => product.rating, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @ManyToOne(() => User, (user) => user.rating, { onDelete: 'CASCADE' })
  user: User;
}
