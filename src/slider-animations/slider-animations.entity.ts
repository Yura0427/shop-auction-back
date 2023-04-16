import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SliderAnimation extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({
    unique: true,
    nullable: false,
  })
  public animation: string;

  @Column({
    type: 'boolean',
    nullable: false,
  })
  public active: boolean;
}
