import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'confirmation-token' })
export class ConfirmationToken {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  public id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column()
  public userId: number;

  @Column()
  public token: string;
}
