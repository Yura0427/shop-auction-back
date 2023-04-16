import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCharacteristicGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  categoryId: number
}