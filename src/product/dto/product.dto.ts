import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class GetProductDto {
  @ApiProperty()
  @IsInt()
  public skip?: number = 0;

  @ApiProperty()
  @IsInt()
  public take?: number = 30;
}

export class GetNewProductDto {
  @ApiProperty()
  @Min(4)
  @Max(20)
  @IsInt()
  public take?: number;
}
