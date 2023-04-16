import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import { BaseEntity } from 'src/shared/base.entity';
import { Product } from '../product/product.entity';
import { Order } from '../orders/orders.entity';

@Entity()
export class ProductToOrder extends BaseEntity {
  @Column()
  public quantity: number;

  @Column()
  public parcelNumber: string;

  @Column()
  public amount: number;

  @Column({ nullable: true })
  public amountWithoutDiscount: number;

  @Column({ nullable: true })
  size: string;

  @Column({ nullable: true })
  color: string;

  @Column()
  productId: number;

  @ManyToOne(() => Product, (product) => product.productToOrder)
  @JoinColumn()
  public product: Product;

  @ManyToOne(() => Order, (order) => order.productToOrder)
  @JoinColumn()
  public order: Order;
}
