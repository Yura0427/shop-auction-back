import { Like } from '../like.entity';

export class PaginatedLikesDto {
  data: Like[];
  count: number;
  totalPages: number;
}
