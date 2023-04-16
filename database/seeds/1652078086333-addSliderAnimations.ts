import { SliderAnimation } from 'src/slider-animations/slider-animations.entity';
import { getRepository, MigrationInterface, QueryRunner } from 'typeorm';

export class addSliderAnimations1652078086333 implements MigrationInterface {
  sliderAnimationsRepository = getRepository(SliderAnimation, 'seeds');

  public async up(queryRunner: QueryRunner): Promise<void> {
    const animations = [
      {
        animation: 'coverflow',
        active: false,
      },
      {
        animation: 'slide',
        active: true,
      },
      {
        animation: 'fade',
        active: false,
      },
      {
        animation: 'flip',
        active: false,
      },
    ];

    this.sliderAnimationsRepository.save(animations);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    this.sliderAnimationsRepository.clear();
  }
}
