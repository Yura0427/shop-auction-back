import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ChangeMainImgDto {
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @IsNotEmpty()
  @IsString()
  imgName: string;
}
