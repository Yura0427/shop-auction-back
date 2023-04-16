import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  ForbiddenException,
  Inject,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ITracedRequest } from '../middlewares/traceRequests.middleware';
import { Logger } from 'winston';
import { Target } from './logger/log-stream-handler';

const ADMIN_PAGE_URL = process.env.ADMIN_PAGE_URL;
const CLIENT_PAGE_URL = process.env.CLIENT_PAGE_URL;

@Catch(ForbiddenException)
export class ForbiddenExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: ForbiddenException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<ITracedRequest>();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const sourceUrl = request.get('Origin');
    if (
      (sourceUrl && sourceUrl === ADMIN_PAGE_URL) ||
      (sourceUrl && sourceUrl === CLIENT_PAGE_URL)
    ) {
      const { traceId, method, user, body, url } = request;
      let corectedBody: any = { ...body };
      if (corectedBody?.password) corectedBody.password = '******';
      let corectedUser: any = { ...user };
      if (corectedUser?.password) corectedUser.password = '******';

      const targetUrl = request.get('host') + url;
      this.logger.warn({
        error: `${exception.name}: ${exception.message}`,
        errorDetals: exception.stack || null,
        label: 'warning',
        source: sourceUrl === ADMIN_PAGE_URL ? Target.admin : Target.user,
        errorStatus: status || HttpStatus.INTERNAL_SERVER_ERROR,
        traceId,
        targetUrl,
        method,
        user: corectedUser || null,
        body: corectedBody || null,
      });
    }

    response.status(status).json({
      statusCode: status,
      message: 'У вас недостатньо прав доступу!',
    });
  }
}
