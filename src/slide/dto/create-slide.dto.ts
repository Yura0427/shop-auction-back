import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSlideDto {
  @ApiProperty({ type: String, format: 'binary' })
  image: string;

  @ApiProperty({ type: String, format: 'binary' })
  imageMobile: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly text: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly href: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  readonly isShown: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  readonly priority: number;
}
