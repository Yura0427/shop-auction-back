import {ExecutionContext, Injectable} from "@nestjs/common";
import {Observable} from "rxjs";

import {AuthGuard} from "@nestjs/passport";
import {UserRoleEnum} from "../../user/user.enum";

@Injectable()
export class SelfOrAdminGuard extends AuthGuard('jwt'){
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        if (user.role?.name  === UserRoleEnum.admin) return true;

        const id = req.params.id || req.body.id;
        console.log(req.params, user.id, id)
        return user.id == id;
    }
}