import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ required: false })
  userId: any;
}
