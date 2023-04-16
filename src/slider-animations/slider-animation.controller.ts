import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { AuthorizedGuard } from '../auth/guards/authorized.guard';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { SliderAnimationService } from './slider-animations.service';

@ApiTags('Slider-animations')
@Controller('slider-animations')
@UseInterceptors(LoggingInterceptor)
export class SliderAnimationController {
  constructor(private sliderAnimationService: SliderAnimationService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  async getAll() {
    return await this.sliderAnimationService.getAllAnimations();
  }

  @Get('active')
  async getByActiveStatus() {
    return await this.sliderAnimationService.getByActiveStatus();
  }

  @Patch('/change-active/:id/:isActive')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  async changeActiveAnim(@Param() params) {
    return await this.sliderAnimationService.changeActiveAnim(
      params.id,
      params.isActive,
    );
  }
}
