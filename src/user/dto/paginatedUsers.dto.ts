import { User } from '../user.entity';

export class GetUserByEmail {
  data: User[];
  count: number;
  totalPages: number;
}

export class PaginatedUsers extends GetUserByEmail {
  currentPage: number;
}
