import {
  Entity,
  Column,
  OneToMany,
  Tree,
  TreeChildren,
  TreeParent,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { Product } from 'src/product/product.entity';
import { File } from 'src/files/files.entity';
import { BaseEntity } from '@shared/base.entity';
import { Characteristic } from '../characteristics/characteristics.entity';
import { CharacteristicGroup } from '../characteristic-group/characteristic-group.entity';

@Entity({ name: 'categories' })
@Tree('materialized-path')
export class Category extends BaseEntity {
  @ApiProperty()
  @Column()
  public name: string;

  @ApiProperty()
  @Column({
    unique: true,
  })
  public key: string;

  @ApiProperty()
  @Column()
  description: string;

  @Column({ default: false })
  @ApiProperty()
  disabled: boolean;

  @TreeChildren({ cascade: true })
  children: Category[];

  @TreeParent({ onDelete: 'CASCADE' })
  parent: Category;

  mpath?: string;

  @ApiProperty({ type: () => Product })
  @OneToMany(() => Product, (product) => product.category)
  public products: Product[];

  @OneToMany(() => Characteristic, (characteristic) => characteristic.category)
  characteristics: Characteristic[];

  @OneToMany(
    () => CharacteristicGroup,
    (characteristicGroup) => characteristicGroup.category,
  )
  characteristicGroup: CharacteristicGroup[];

  @ApiProperty({ type: () => File })
  @OneToOne(() => File, (icon) => icon.category)
  @JoinColumn()
  icon: File;
}

export class CustomCategory extends Category {
  priceRange?: {
    min: number;
    max: number;
  };
  ascCategories?: Partial<Category>[];
}
