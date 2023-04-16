import {
  Entity,
  Column, OneToMany,
} from 'typeorm';

import { BaseEntity } from '@shared/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { File } from '../files/files.entity';

@Entity({ name: 'slides' })
export class Slide extends BaseEntity {

  @Column()
  name: string;

  @Column()
  text: string;

  @Column()
  image: string;

  @Column()
  imageMobile: string;

  @Column()
  href: string;

  @Column()
  isShown: boolean;

  @Column()
  priority: number;

  @ApiProperty({ type: () => File })
  @OneToMany(() => File, (files) => files.slide)
  public files: File[];
}
