import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '@shared/base.entity';
import { Category } from '../category/category.entity';
import { CharacteristicTypes } from './characteristics.enum';
import { CharacteristicValue } from '../characteristics-values/characteristics-values.entity';
import { CharacteristicGroup } from '../characteristic-group/characteristic-group.entity';

@Entity({ name: 'characteristics' })
export class Characteristic extends BaseEntity {
  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ default: false, type: 'boolean' })
  required: boolean;

  @Column({
    type: 'enum',
    enum: CharacteristicTypes,
  })
  type: CharacteristicTypes;

  @Column({ nullable: true, type: 'json' })
  defaultValues: JSON;

  @Column({ nullable: true })
  minValue: number;

  @Column({ nullable: true })
  maxValue: number;

  @ManyToOne(() => Category, (category) => category.characteristics)
  category: Category;

  @ManyToOne(
    () => CharacteristicGroup,
    (characteristicGroup) => characteristicGroup.characteristic,
    { onDelete: 'CASCADE' },
  )
  group: CharacteristicGroup;

  @OneToMany(
    () => CharacteristicValue,
    (characteristicValue) => characteristicValue.characteristic,
    { onDelete: 'CASCADE' },
  )
  characteristicValue: CharacteristicValue[];
}
