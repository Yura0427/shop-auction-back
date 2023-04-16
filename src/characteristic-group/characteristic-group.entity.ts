import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '@shared/base.entity';
import { Characteristic } from '../characteristics/characteristics.entity';
import { Category } from '../category/category.entity';

@Entity({ name: 'characteristicGroup' })
export class CharacteristicGroup extends BaseEntity {
  @Column()
  name: string;

  @ManyToOne(() => Category, (category) => category.characteristicGroup)
  category: Category;

  @OneToMany(() => Characteristic, (characteristic) => characteristic.group, {
    onDelete: 'CASCADE',
  })
  characteristic: Characteristic[];
}
