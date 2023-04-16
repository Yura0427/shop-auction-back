import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from '@shared/base.entity';
import { Order } from '../orders/orders.entity';
import { File } from 'src/files/files.entity';
import { Comment } from 'src/comments/comments.entity';
import { Like } from '../likes/like.entity';
import { Role } from './role/role.entity';
import { Feedback } from 'src/feedbacks/feedbacks.entity';
import { Rating } from '../ratings/ratings.entity';
import { Delivery } from '../delivery/delivery.entity';

export enum UserStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  BLOCKED = 'blocked',
}

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: true,
  })
  public firstName: string;

  @Column({
    nullable: true,
  })
  public lastName: string;

  @Column({
    nullable: true,
  })
  public phoneNumber: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  public password: string;

  @Column({ nullable: true })
  public dateOfBirth: Date;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  facebookId: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  public status: UserStatus;

  @Column({ nullable: true })
  telegramId: string;

  @Column({ nullable: true })
  wafCoins: number;

  @Column({ nullable: true })
  winnerDate: Date;

  @Column({
    nullable: false,
    default: 0
  })
  userWallet: string;

  @ApiProperty({ type: () => Role })
  @ManyToOne(() => Role, (role) => role.users)
  public role: Role;

  @OneToMany(() => Like, (likes) => likes.user)
  likes: Like;

  @OneToMany(() => Rating, (ratings) => ratings.user)
  rating: Rating;

  @ApiProperty({ type: () => Comment })
  @OneToMany(() => Comment, (comments) => comments.author)
  public comments: Comment[];

  @ApiProperty({ type: () => Feedback })
  @OneToMany(() => Feedback, (feedbacks) => feedbacks.author)
  public feedbacks: Feedback[];

  @ApiProperty({ type: () => File })
  @OneToOne(() => File, (avatar) => avatar.user, {
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  public avatar: File;

  @ManyToOne(() => Delivery, (delivery) => delivery.user)
  public delivery: Delivery;

  @OneToMany(() => Order, (order) => order.user)
  public order: Order[];
}
