import { Comment } from '../comments.entity';

export class PaginatedCommentsDto {
  data: Comment[];
  count: number;
  totalPages: number;
  page: number;
}
