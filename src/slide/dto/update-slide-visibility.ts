import { IsNotEmpty, IsBoolean } from 'class-validator';

export class UpdateSlideVisibility {
  @IsNotEmpty()
  @IsBoolean()
  isShown: boolean;
}
