import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';

@Entity('colorsPicturesFiles')
export class ColorsPicturesFiles {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column('varchar', { length: 250 })
  colorName: string;

  @Column('int', { array: true })
  colorId: string[];

  @Column('varchar', { array: true })
  colorFile: string[];

  @Column('varchar', { length: 7 })
  hexColor: string;
}
