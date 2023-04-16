import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@shared/base.entity';

export type json = string;

@Entity({ name: 'parameters' })
export class Parameters extends BaseEntity {
  @Column({ unique: true })
  @ApiProperty()
  public name: string;

  @Column({ type: 'jsonb' })
  @ApiProperty()
  public settings: json;
}
