import {
  Body,
  Controller,
  Get,
  Post,
  ParseIntPipe,
  Param,
  Request,
  UseGuards,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { PaginationDto } from '@shared/pagination.dto';
import { AuthorizedGuard } from '../auth/guards/authorized.guard';
import { LikesDto } from './dto/likes.dto';
import { PaginatedLikesDto } from './dto/paginatedLikes.dto';
import { Like } from './like.entity';
import { LikeService } from './like.service';
import { IRequest } from '../user/interfaces/request.interface';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';

@ApiBearerAuth()
@UseGuards(AuthorizedGuard)
@ApiTags('Likes')
@Controller('likes')
@UseInterceptors(LoggingInterceptor)
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post('product')
  async addLikeProduct(
    @Request() req: IRequest,
    @Body() body: LikesDto,
  ): Promise<Like[]> {
    return this.likeService.addLikeProduct(req.user.id, body);
  }

  @Get('product/:userId')
  async getAllLikesProduct(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedLikesDto> {
    return this.likeService.getUserLikesProduct(userId, paginationDto);
  }

  @Get('product')
  async getLikeProduct(
    @Request() req: IRequest,
    @Query() productsId,
  ): Promise<Like[]> {
    return this.likeService.getLikeProduct(req.user.id, productsId);
  }
}
