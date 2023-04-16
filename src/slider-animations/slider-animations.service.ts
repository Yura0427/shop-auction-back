import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SliderAnimation } from './slider-animations.entity';

@Injectable()
export class SliderAnimationService {
  constructor(
    @InjectRepository(SliderAnimation)
    private sliderAnimationsRepo: Repository<SliderAnimation>,
  ) {}

  public async getAllAnimations(): Promise<SliderAnimation[]> {
    return await this.sliderAnimationsRepo.find();
  }

  public async getByActiveStatus(): Promise<SliderAnimation> {
    return await this.sliderAnimationsRepo.findOne({ active: true });
  }

  public async changeActiveAnim(
    id: number,
    isActive: string,
  ): Promise<SliderAnimation> {
    const animation = await this.sliderAnimationsRepo.findOne({ id });
    if (isActive === 'true') {
      animation.active = true;
    } else if (isActive === 'false') {
      animation.active = false;
    }
    return await this.sliderAnimationsRepo.save(animation);
  }
}
