import { User, UserStatus } from '../user/user.entity';
import { Role } from '../user/role/role.entity';
import { Like } from '../likes/like.entity';
import { Rating } from '../ratings/ratings.entity';
import { Comment } from '../comments/comments.entity';
import { File } from '../files/files.entity';
import { Order } from '../orders/orders.entity';
import { Delivery } from '../delivery/delivery.entity';

interface CustomUser extends User {
  hasPassword: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface GoogleAuthRes {
  token: string;
  user: CustomUser;
}

export interface CutUsersEntity {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  status: UserStatus;
  role: Role;
  likes: Like;
  rating: Rating;
  comments: Comment[];
  avatar: File;
  order: Order[];
  delivery: Delivery;
}

export interface CutUserRegisterResponse {
  token: string;
  user: CutUsersEntity;
  isExistingUser?: boolean;
}
