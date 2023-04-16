import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { BaseEntity } from 'src/shared/base.entity';
import { Category, CustomCategory } from 'src/category/category.entity';
import { File } from 'src/files/files.entity';
import { CharacteristicValue } from '../characteristics-values/characteristics-values.entity';
import { Comment } from 'src/comments/comments.entity';
import { ProductToOrder } from 'src/product-to-order/product-to-order.entity';
import { Rating } from '../ratings/ratings.entity';
import { Like } from 'src/likes/like.entity';

@Entity({ name: 'products' })
export class Product extends BaseEntity {

  @ApiProperty()
  @Column()
  public name: string;

  @ApiProperty()
  @Column({ nullable: true, unique: true })
  public key: string;

  @ApiProperty()
  @Column({ nullable: true })
  public description: string;

  @ApiProperty()
  @Column()
  public nameInProvider: string;

  @ApiProperty()
  @Column()
  public price: number;

  @ApiProperty()
  @Column({ nullable: true })
  public discountedPrice: number;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  availability: boolean;

  @Column()
  url: string;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  disabled: boolean;

  @ApiProperty()
  @Column({ type: 'numeric', precision: 10, scale: 1, default: 0 })
  public avgRating: string;

  @ApiProperty()
  @Column({ default: 0 })
  public numRates: number;

  @ApiProperty()
  @Column({ nullable: true })
  public shopKey: string;

  @ApiProperty({ type: () => Category })
  @ManyToOne(() => Category, (category) => category.products)
  public category: CustomCategory;

  @ApiProperty({ type: () => File })
  @OneToMany(() => File, (files) => files.product)
  public files: File[];

  @ApiProperty({ type: () => File })
  @OneToOne(() => File, (files) => files.product, { onDelete: 'SET NULL' })
  @JoinColumn()
  public mainImg: File;

  @OneToMany(
    () => CharacteristicValue,
    (characteristicValue) => characteristicValue.product,
  )
  characteristicValue: CharacteristicValue[];

  @OneToMany(() => Comment, (comments) => comments.product, {
    onDelete: 'SET NULL',
  })
  public comments: Comment[];

  @OneToMany(() => ProductToOrder, (productToOrder) => productToOrder.product, {
    cascade: true,
  })
  public productToOrder: ProductToOrder[];

  @OneToMany(() => Like, (likes) => likes.product)
  likes: Like;

  @OneToMany(() => Rating, (ratings) => ratings.product)
  rating: Rating;
}
