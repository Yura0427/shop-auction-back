import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/shared/base.entity';
import { File } from 'src/files/files.entity';

@Entity({ name: 'invoices' })
export class Invoice extends BaseEntity {
  @ApiProperty()
  @Column({ nullable: true })
  public fileSize: number;

  @ApiProperty({ type: () => File })
  @OneToOne(() => File)
  @JoinColumn()
  public invoiceFile: File;
}
