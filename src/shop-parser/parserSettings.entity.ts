import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export type json = string;

@Entity({ name: 'parserSettings' })
export class ParserSettings {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  public id: number;

  @Column()
  @ApiProperty()
  public parserName: string;

  @Column()
  @ApiProperty()
  public parserStatus: string;

  @Column()
  @ApiProperty()
  public lastMessage: string;

  @Column()
  @ApiProperty()
  public lastStart: Date;

  @Column()
  @ApiProperty()
  public lastUpdate: Date;

  @Column()
  @ApiProperty()
  public lastError: Date;

  @Column()
  @ApiProperty()
  public lastParsedProduct: number;

  @Column()
  @ApiProperty()
  public errorStatus: number;
}
