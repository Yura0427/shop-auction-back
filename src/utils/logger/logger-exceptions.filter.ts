import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { ITracedRequest } from '../../middlewares/traceRequests.middleware';
import { Target } from './log-stream-handler';

const ADMIN_PAGE_URL = process.env.ADMIN_PAGE_URL;
const CLIENT_PAGE_URL = process.env.CLIENT_PAGE_URL;

@Catch(HttpException)
export class LoggerExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<ITracedRequest>();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

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
      this.logger.error({
        error: `${exception.name}: ${exception.message}`,
        errorDetals: exception.stack || null,
        label: 'error',
        source: sourceUrl === ADMIN_PAGE_URL ? Target.admin : Target.user,
        errorStatus: httpStatus,
        traceId,
        targetUrl,
        method,
        user: corectedUser || null,
        body: corectedBody || null,
      });
    }

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message: exception.message,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
