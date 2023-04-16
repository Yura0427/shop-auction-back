import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleEnum } from '../../user/user.enum';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
  handleRequest(err, user, info) {
    const forbidden =
      user.role?.name === UserRoleEnum.admin ||
      user.role?.name === UserRoleEnum.moderator;
    if (err || !user || !forbidden) {
      throw err || new ForbiddenException();
    }

    return user;
  }
}
