import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from 'src/product/product.entity';
import { User } from 'src/user/user.entity';
import { Comment } from './comments.entity';
import { CustomValidation } from 'src/utils/custom-validation';
import { PaginatedCommentsDto } from './dto/paginatedComments.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { getTotalPages } from 'src/utils/get-total-pages';
import { PaginationDto } from '@shared/pagination.dto';
import { ICommentsByDateRange } from '../interfaces/commentsByDateRange.interface';
import { allCommentsReq } from './dto/allCommentsReq.dto';
import { DeleteCommentDto } from './dto/deleteComment.dto';

const authorFields = [
  'author.id',
  'author.firstName',
  'author.lastName',
  'author.email',
];

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getAllComments(
    paginationDto: allCommentsReq,
  ): Promise<PaginatedCommentsDto> {
    const {
      page = 1,
      limit = 10,
      sort = 'id',
      sortDirect = 'ASC',
    } = paginationDto;
    const skippedItems = (page - 1) * limit || 0;

    const [data, count]: [Comment[], number] = await this.commentRepository
      .createQueryBuilder('comments')
      .select()
      .orderBy(
        `comments.${sort}`,
        `${sortDirect.toUpperCase() as 'ASC' | 'DESC'}`,
      )
      .leftJoin('comments.author', 'author')
      .leftJoinAndSelect('author.avatar', 'avatar')
      .addSelect(authorFields)
      .leftJoin('comments.product', 'product')
      .addSelect(['product.id'])
      .take(limit)
      .skip(skippedItems)
      .getManyAndCount();

    const totalPages = getTotalPages(count, limit, page);

    return { data, count, totalPages, page };
  }

  async getCommentsByDate(range: string[]): Promise<ICommentsByDateRange[]> {
    const comments = await this.commentRepository
      .createQueryBuilder('comments')
      .select([
        "to_char(comments.createdAt, 'YYYY-MM-DD') AS date",
        'count(comments.createdAt) as creatad',
      ])
      .where('comments.createdAt between :dateStart and :dateStop', {
        dateStart: range[0],
        dateStop: range[1],
      })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    if (!comments.length)
      throw new HttpException(
        'Дані за обраний період відсутні',
        HttpStatus.NOT_FOUND,
      );

    return comments;
  }

  async getProductComments(
    productId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedCommentsDto> {
    const product = await this.productRepository.findOne(productId);
    new CustomValidation().notFound('Продукт', 'ID', productId, product);

    const page = Number(paginationDto.page);
    const limit = Number(paginationDto.limit) || 10;
    const skippedItems = (page - 1) * limit;

    const [data, count]: [
      Comment[],
      number,
    ] = await this.commentRepository
      .createQueryBuilder('comments')
      .select()
      .orderBy('comments.createdAt', 'DESC')
      .leftJoin('comments.author', 'author')
      .addSelect(authorFields)
      .leftJoinAndSelect('author.avatar', 'avatar')
      .leftJoin('comments.product', 'product')
      .addSelect(['product.id'])
      .where('product.id = :id', { id: productId })
      .take(limit)
      .skip(skippedItems)
      .getManyAndCount();

    const totalPages = getTotalPages(count, limit, page);

    return { data, count, totalPages, page };
  }

  async getUserComments(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedCommentsDto> {
    const user = await this.userRepository.findOne(userId);
    new CustomValidation().notFound('Користувач', 'ID', userId, user);

    const page = Number(paginationDto.page);
    const limit = Number(paginationDto.limit) || 10;
    const skippedItems = (page - 1) * limit;

    const [data, count]: [
      Comment[],
      number,
    ] = await this.commentRepository
      .createQueryBuilder('comments')
      .select()
      .orderBy('comments.createdAt', 'DESC')
      .leftJoin('comments.author', 'author')
      .addSelect(authorFields)
      .where('author.id = :id', { id: userId })
      .leftJoin('comments.product', 'product')
      .addSelect('product')
      .leftJoinAndSelect('product.mainImg', 'mainImg.name')
      .leftJoin('product.category', 'category')
      .addSelect('category.key')
      .take(limit)
      .skip(skippedItems)
      .getManyAndCount();

    const totalPages = getTotalPages(count, limit, page);

    return { data, count, totalPages, page };
  }

  async getOneComment(commentId: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne(commentId);
    new CustomValidation().notFound('Коментар', 'ID', commentId, comment);

    return this.commentRepository
      .createQueryBuilder('comments')
      .select()
      .where({ id: commentId })
      .leftJoin('comments.author', 'author')
      .addSelect(authorFields)
      .leftJoinAndSelect('author.avatar', 'avatar')
      .leftJoin('comments.product', 'product')
      .addSelect(['product'])
      .leftJoinAndSelect('product.mainImg', 'mainImg.name')
      .leftJoinAndSelect('product.category', 'category')
      .getOne();
  }

  async createComment(
    userId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const { text, productId } = createCommentDto;

    const product = await this.productRepository.findOne(productId);
    new CustomValidation().notFound('Продукт', 'ID', productId, product);

    const user = await this.userRepository.findOne(userId);
    new CustomValidation().notFound('Користувач', 'ID', userId, user);

    const comment = await this.commentRepository.save({
      text,
      product,
      author: user,
    });

    return this.getOneComment(comment.id);
  }

  async updateComment(
    commentId: number,
    userId: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    const user = await this.userRepository.findOne(userId);
    new CustomValidation().notFound('Користувач', 'ID', userId, user);

    const comment = await this.commentRepository.findOne(commentId, {
      relations: ['author'],
    });
    new CustomValidation().unathorized(
      'редагування коментарю',
      comment,
      userId,
    );

    const result = await this.commentRepository.update(
      commentId,
      updateCommentDto,
    );
    if (!result.affected) {
      new CustomValidation().notFound('Коментар', 'ID', commentId, comment);
    }

    return this.getOneComment(commentId);
  }

  async deleteComment(commentId: number, userId: number): Promise<boolean> {
    const user = await this.userRepository.findOne(userId);
    new CustomValidation().notFound('Користувач', 'ID', userId, user);

    const comment = await this.commentRepository.findOne(commentId);
    new CustomValidation().notFound('Коментар', 'ID', commentId, comment);
    new CustomValidation().unathorized('видалення коментарю', comment, userId);

    const result = await this.commentRepository.delete(commentId);
    return !!result.affected;
  }

  async deleteCommentById(
    commentId: number,
    body: allCommentsReq,
  ): Promise<DeleteCommentDto> {
    const comment = await this.commentRepository.findOne(commentId);
    new CustomValidation().notFound('Коментар', 'ID', commentId, comment);

    const result =
      (await this.commentRepository.delete(commentId)) &&
      (await this.getAllComments(body));

    return {
      message: `Коментар з id: ${commentId} успішно видалено.`,
      ...result,
    };
  }
}
