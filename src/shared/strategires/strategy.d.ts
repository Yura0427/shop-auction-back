import { User } from "src/user/user.entity";

export interface IUserValidationStrategy {
  validate: (user: User) => void;
}
