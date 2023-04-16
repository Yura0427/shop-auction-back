import { Injectable, NestMiddleware } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface ITracedRequest extends Request {
  traceId: string;
}

@Injectable()
export class TraceRequestMiddleware implements NestMiddleware {
  use(req: ITracedRequest, res: Response, next: NextFunction) {
    const traceId = uuidv4();
    req.traceId = traceId;
    next();
  }
}
