import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from 'src/user/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Feedback {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  public id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column('varchar', { length: 3000 })
  text: string;

  @ManyToOne(() => User, (user) => user.feedbacks, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    nullable: true,
  })
  author: User;

  @Column('varchar', { nullable: true })
  authorIP: string;
}
