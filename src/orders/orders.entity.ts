import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';

import { User } from '../user/user.entity';
import { BaseEntity } from '@shared/base.entity';
import { Status } from './orderStatus.enum';
import { ProductToOrder } from 'src/product-to-order/product-to-order.entity';
import { Delivery } from '../delivery/delivery.entity';

@Entity({ name: 'orders' })
export class Order extends BaseEntity {
  @Column({
    type: 'enum',
    enum: Status,
    default: Status.OPEN,
  })
  public status: Status;

  @Column({ nullable: true })
  public amount: number;

  @Column({ nullable: true })
  public amountWithoutDiscount: number;

  @Column({ nullable: true })
  public additionalFirstName: string;

  @Column({ nullable: true })
  public additionalLastName: string;

  @Column({ nullable: true })
  public additionalEmail: string;

  @Column({ nullable: true })
  public additionalNumber: string;

  @Column({ nullable: true })
  public comment: string;

  @Column({ nullable: true })
  public notcall: boolean;

  @Column({ nullable: false })
  public orderIdForLiqpay: string;

  @Column({ nullable: true })
  public liqpayOrderId: string;

  @Column({ nullable: true })
  public liqpayPaymentStatus: string;

  @Column({ nullable: false, default: false })
  public paymentStatus: boolean;

  @Column({ nullable: false, default: false })
  public isSentByCheckbox: boolean;

  @ManyToOne(() => User, (user) => user.order, {
    onDelete: 'SET NULL',
  })
  public user: User;

  @OneToMany(() => ProductToOrder, (productToOrder) => productToOrder.order, {
    cascade: true,
  })
  public productToOrder: ProductToOrder[];

  @ManyToOne(() => Delivery, (delivery) => delivery.order)
  public delivery: Delivery;
}
