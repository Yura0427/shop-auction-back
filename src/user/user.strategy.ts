import { HttpException, HttpStatus } from '@nestjs/common';
import { User } from './user.entity';
import { Role } from './role/role.entity';

export interface IUserValidationStrategy {
  validate: (user: User) => void;
}

export class ValidateUserRoleStrategy implements IUserValidationStrategy {
  constructor(private roles: Role[]) {}

  public validate(user: User): void {
    const filteredRoleIds = this.roles.map((role) => role.id);

    if (!filteredRoleIds.includes(user.role.id)) {
      throw new HttpException(
        'У вас не достатньо прав доступу',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
