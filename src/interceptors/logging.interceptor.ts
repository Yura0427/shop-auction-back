import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Observable } from 'rxjs';
import { Logger } from 'winston';
import { tap } from 'rxjs/operators';
import { JwtService } from '@nestjs/jwt';
import { Target } from '../utils/logger/log-stream-handler';
import {
  responseClientDataFilter,
  responseAdminDataFilter,
} from '../utils/logger/responseDataFilter';

const ADMIN_PAGE_URL = process.env.ADMIN_PAGE_URL;
const CLIENT_PAGE_URL = process.env.CLIENT_PAGE_URL;

enum LoggerTargetsFilter {
  getLastOrderWithoutAuth = 'getLastOrderWithoutAuth',
  addOrder = 'addOrder',
  createDelivery = 'createDelivery',
  deleteFromCart = 'deleteFromCart',
  clearCart = 'clearCart',
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly jwtService: JwtService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const sourceUrl = request.get('Origin');
    let writeToLog = false;

    if (
      (sourceUrl && sourceUrl === ADMIN_PAGE_URL) ||
      (sourceUrl && sourceUrl === CLIENT_PAGE_URL)
    ) {
      const { traceId, method, url, body, params } = request;
      let corectedBody = { ...body };
      if (corectedBody?.password) corectedBody.password = '******';

      const controller = context.getClass().name;
      const target = context.getHandler().name;
      const targetUrl = request.get('host') + url;

      let { user } = request;
      let corectedUser = null;
      if (!user && request.get('authorization')) {
        const token = request.get('authorization').split(' ')[1];
        user = this.jwtService.verify(token);
        corectedUser = { ...user };
        if (corectedUser?.password) corectedUser.password = '******';
      }

      writeToLog = true;
      this.logger.info({
        label: 'request',
        source: sourceUrl === ADMIN_PAGE_URL ? Target.admin : Target.user,
        traceId,
        user: corectedUser || null,
        method,
        targetUrl,
        location: { controller, target },
        body: corectedBody || null,
        params: params || null,
      });

      return next.handle().pipe(
        tap((res) => {
          const { statusCode } = context.switchToHttp().getResponse();
          let response = { ...res };
          if (response.user?.password) response.user.password = '******';
          if (response.data?.length) {
            response.data.forEach((user: { password: string | undefined }) => {
              if (user.password) user.password = '******';
            });
          }

          if (writeToLog) {
            this.logger.info({
              label: 'response',
              source: sourceUrl === ADMIN_PAGE_URL ? Target.admin : Target.user,
              traceId,
              user: corectedUser || null,
              location: { controller, target },
              statusCode,
              body:
                sourceUrl === ADMIN_PAGE_URL
                  ? responseAdminDataFilter(response, target)
                  : responseClientDataFilter(response, target),
            });
          }
        }),
      );
    }
    return next.handle();
  }
}
