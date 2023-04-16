import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from 'src/product/product.entity';
import { User } from 'src/user/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  public id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column('varchar', { length: 500 })
  text: string;
  
  @Column('integer')
  productId: string;

  @ManyToOne(() => User, (user) => user.comments, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  author: Partial<User>;

  @ManyToOne(() => Product, (product) => product.comments, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  product: Product;
}
