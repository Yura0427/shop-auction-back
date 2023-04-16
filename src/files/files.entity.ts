import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinTable, ManyToOne, OneToOne } from 'typeorm';

import { BaseEntity } from '@shared/base.entity';
import { Product } from 'src/product/product.entity';
import { User } from 'src/user/user.entity';
import { Slide } from '../slide/slide.entity';
import { Invoice } from 'src/invoice/invoice.entity';
import { Category } from 'src/category/category.entity';

@Entity({ name: 'files' })
export class File extends BaseEntity {
  @ApiProperty()
  @Column()
  public name: string;

  @ApiProperty({ type: () => Product })
  @ManyToOne(() => Product, (product) => product.files, { onDelete: 'CASCADE' })
  public product: Product;

  @ApiProperty({ type: () => Slide })
  @ManyToOne(() => Slide, (slide) => slide.files, { onDelete: 'CASCADE' })
  public slide: Slide;

  @ApiProperty({ type: () => User })
  @OneToOne(() => User, (user) => user.avatar, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  user: User;

  @ApiProperty({ type: () => Category })
  @OneToOne(() => Category, (category) => category.icon)
  public category: Category;
}
