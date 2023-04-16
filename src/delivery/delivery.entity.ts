import { Column,  Entity, JoinColumn, OneToMany } from 'typeorm';

import { BaseEntity } from '@shared/base.entity';
import { User } from '../user/user.entity';
import { Order } from '../orders/orders.entity';

@Entity({ name: 'delivery' })
export class Delivery extends BaseEntity {
  @Column({
    nullable: true,
  })
  public areaName: string;

  @Column({
    nullable: true,
  })
  public cityName: string;

  @Column({
    nullable: true,
  })
  public cityFullName: string;

  @Column({
    nullable: true,
  })
  public cityRef: string;

  @Column({
    nullable: true,
  })
  public streetName: string;

  @Column({
    nullable: true,
  })
  public streetRef: string;

  @Column({
    nullable: true,
  })
  public deliveryMethod: string;

  @Column({
    type: String,
    nullable: true,
  })
  public courierDeliveryAddress: string | null;

  @OneToMany(() => User, (user) => user.delivery)
  @JoinColumn()
  public user: User;

  @OneToMany(() => Order, (order) => order.delivery)
  @JoinColumn()
  public order: Order;
}


