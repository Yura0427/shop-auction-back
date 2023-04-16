import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { IResponseMessage } from 'src/interfaces/response-message.interface';
import { FeedbackService } from './feedbacks.service';
import { IDeleteMessage } from 'src/interfaces/delete-message.interface';
import { PaginatedFeedbacksDto } from './dto/paginated-feedbacks.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { allFeedbacksReq } from './dto/allFeedbacksReq.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthorizedGuard } from '../auth/guards/authorized.guard';

@ApiTags('Feedbacks')
@Controller('feedbacks')
@UseInterceptors(LoggingInterceptor)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  @UseGuards(AuthorizedGuard, AdminGuard)
  async getAllFeedbacks(
    @Query() paginationDto: allFeedbacksReq,
  ): Promise<PaginatedFeedbacksDto> {
    return this.feedbackService.getAllFeedbacks(paginationDto);
  }

  @Post()
  async createFeedback(
    @Request() req,
    @Body() createFeedbackDto: CreateFeedbackDto,
  ): Promise<IResponseMessage> {
    return this.feedbackService.createFeedback(req.ip, createFeedbackDto);
  }

  @Post('admin/:feedbackId')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  async deleteFeedbackById(
    @Param('feedbackId', ParseIntPipe) feedbackId: number,
    @Body() body: allFeedbacksReq,
  ): Promise<IDeleteMessage> {
    return await this.feedbackService.deleteFeedbackById(feedbackId, body);
  }
}
