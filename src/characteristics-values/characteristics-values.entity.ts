import { Column, Entity, ManyToOne } from 'typeorm';

import { BaseEntity } from '@shared/base.entity';
import { CharacteristicTypes } from '../characteristics/characteristics.enum';
import { Product } from '../product/product.entity';
import { Characteristic } from '../characteristics/characteristics.entity';


@Entity({ name: 'characteristicsValues' })
export class CharacteristicValue extends BaseEntity {
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: CharacteristicTypes,
  })
  type: CharacteristicTypes;

  @Column({ nullable: true })
  stringValue: string;

  @Column({ nullable: true })
  numberValue: number;

  @Column({ nullable: true, type: 'simple-array' })
  enumValue: string[] | number[];

  @Column({ nullable: true, type: 'boolean' })
  booleanValue: boolean;

  @Column({ nullable: true, type: 'jsonb' })
  jsonValue: JSON;

  @Column({ nullable: true, type: 'date' })
  dateValue: Date;

  @ManyToOne(
    () => Product, product => product.characteristicValue,
  )
  product: Product;

  @ManyToOne(
    () => Characteristic,
    characteristic => characteristic.characteristicValue,
    {onDelete: 'CASCADE'}
  )
  characteristic: Characteristic;
}
