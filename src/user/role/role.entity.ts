import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from '@shared/base.entity';
import { User } from '../user.entity';

@Entity({ name: 'roles' })
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    unique: true,
  })
  public name: string;

  @OneToMany(() => User, (user) => user.role)
  public users: User[];
}
