import { Feedback } from '../feedbacks.entity';

export class PaginatedFeedbacksDto {
  data: Feedback[];
  count: number;
  totalPages: number;
  page: number;
}
