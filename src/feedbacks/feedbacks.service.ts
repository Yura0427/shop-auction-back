import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from 'src/user/user.entity';
import { Feedback } from './feedbacks.entity';
import { CustomValidation } from 'src/utils/custom-validation';
import { PaginatedFeedbacksDto } from './dto/paginated-feedbacks.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { DeleteFeedbacksDto } from './dto/delete-feedbacks.dto';
import { getTotalPages } from 'src/utils/get-total-pages';
import { IResponseMessage } from '../interfaces/response-message.interface';
import { allFeedbacksReq } from './dto/allFeedbacksReq.dto';

const authorFields = [
  'author.id',
  'author.firstName',
  'author.lastName',
  'author.email',
];

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getAllFeedbacks(
    paginationDto: allFeedbacksReq,
  ): Promise<PaginatedFeedbacksDto> {
    const {
      page = 1,
      limit = 10,
      sort = 'id',
      sortDirect = 'ASC',
    } = paginationDto;
    const skippedItems = (page - 1) * limit || 0;
    const [data, count]: [Feedback[], number] = await this.feedbackRepository
      .createQueryBuilder('feedbacks')
      .select()
      .orderBy(
        `feedbacks.${sort}`,
        `${sortDirect.toUpperCase() as 'ASC' | 'DESC'}`,
      )
      .leftJoin('feedbacks.author', 'author')
      .addSelect(authorFields)
      .take(limit)
      .skip(skippedItems)
      .getManyAndCount();

    const totalPages = getTotalPages(count, limit, page);

    return { data, count, totalPages, page };
  }

  async createFeedback(
    ipAddress,
    createFeedbackDto: CreateFeedbackDto,
  ): Promise<IResponseMessage> {
    const { userId, text } = createFeedbackDto;
    let user;

    if (userId) {
      user = await this.userRepository.findOne(userId);
    }

    const feedback = await this.feedbackRepository.save({
      text,
      author: user,
      authorIP: ipAddress,
    });

    return {
      message: `Ваш відгук був успішно відправлений. Дякуюємо за підтримку!`,
    };
  }

  async deleteFeedbackById(
    feedbackId: number,
    body: allFeedbacksReq,
  ): Promise<DeleteFeedbacksDto> {
    const feedback = await this.feedbackRepository.findOne(feedbackId);
    new CustomValidation().notFound('Відгук', 'ID', feedbackId, feedback);

    const result =
      (await this.feedbackRepository.delete(feedbackId)) &&
      (await this.getAllFeedbacks(body));
    return {
      message: `Відгук з ID ${feedbackId} був успішно видалений`,
      ...result,
    };
  }
}
