import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CommentService } from './comments.service';
import { Comment } from './comments.entity';
import { AuthorizedGuard } from '../auth/guards/authorized.guard';
import { IDeleteMessage } from 'src/interfaces/delete-message.interface';
import { Req } from 'src/interfaces/comment.interface';
import { PaginatedCommentsDto } from './dto/paginatedComments.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginationDto } from '@shared/pagination.dto';
import { CommentsDateRangeDto } from './dto/comments-date-range.dto';
import { ICommentsByDateRange } from '../interfaces/commentsByDateRange.interface';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { allCommentsReq } from './dto/allCommentsReq.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { DeleteCommentDto } from './dto/deleteComment.dto';

@ApiTags('Comments')
@Controller('comments')
@UseInterceptors(LoggingInterceptor)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  async getAllComments(
    @Query() paginationDto: allCommentsReq,
  ): Promise<PaginatedCommentsDto> {
    return this.commentService.getAllComments(paginationDto);
  }

  @Get('statistic')
  @UseGuards(AuthorizedGuard, AdminGuard)
  async getCommentsByRange(
    @Query() queryDateRange: CommentsDateRangeDto,
  ): Promise<ICommentsByDateRange[]> {
    return this.commentService.getCommentsByDate(queryDateRange.dateRange);
  }

  @Get('product/:productId')
  async getProductComments(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedCommentsDto> {
    return this.commentService.getProductComments(productId, paginationDto);
  }

  @Get('user/:userId')
  @UseGuards(AuthorizedGuard)
  async getUserComments(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedCommentsDto> {
    return this.commentService.getUserComments(userId, paginationDto);
  }

  @Get(':commentId')
  async getOneComment(
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<Comment> {
    return this.commentService.getOneComment(commentId);
  }

  @Post()
  @UseGuards(AuthorizedGuard)
  async createComment(
    @Request() req: Req,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    return this.commentService.createComment(req.user.id, createCommentDto);
  }

  @Patch(':commentId')
  @UseGuards(AuthorizedGuard)
  async updateComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Request() req: Req,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    return this.commentService.updateComment(
      commentId,
      req.user.id,
      updateCommentDto,
    );
  }

  @Post('admin/:commentId')
  @UseGuards(AuthorizedGuard, AdminGuard)
  async deleteCommentById(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() body: allCommentsReq,
  ): Promise<DeleteCommentDto> {
    return await this.commentService.deleteCommentById(commentId, body);
  }

  @Delete(':commentId')
  @UseGuards(AuthorizedGuard)
  async deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Request() req: Req,
  ): Promise<IDeleteMessage> {
    const res = await this.commentService.deleteComment(commentId, req.user.id);
    if (res) {
      return { message: `Коментар з id: ${commentId} успішно видалено.` };
    }
    return new NotFoundException(`Коментар з ID: ${commentId} не знайдено`);
  }
}
