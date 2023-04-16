import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { ImageUtilsService } from 'src/image/image-utils.service';

@Injectable()
export class fileCheckerMiddleware implements NestMiddleware {
  constructor(private imageUtilsService: ImageUtilsService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await this.checkFile(req, res, next);
    } catch (err) {
      return next(err);
    }
  }

  async checkFile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> {
    const errorJpg = 'nojpg.jpg';
    const errorSvg = 'nosvg.svg';
    const options = { root: path.resolve('common/images') };
    const fileExt = req.originalUrl.match(/\.[a-z]{0,4}/gm)[
      req.originalUrl.match(/\.[a-z]{0,4}/gm).length - 1
    ];

    // For local usage
    if (process.env.NODE_ENV === 'local') {
      try {
        const filePath = path.join(process.env.IMG_PATH, req.params.file);
        const isFileExist = fs.existsSync(filePath);
        if (isFileExist) {
          return next();
        }
        return res.sendFile(
          fileExt === '.jpg' || fileExt === '.jpeg' ? errorJpg : errorSvg,
          options,
          (err) => {
            if (err) next(err);
          },
        );
      } catch (err) {
        return next(err);
      }
    }

    // For dev usage
    try {
      const filePath = path.join(process.env.SERVE_ROOT, req.params.file);
      const isFileExist = await this.imageUtilsService.isExistInStorage(
        filePath,
      );
      if (isFileExist) {
        return next();
      }
      return res.sendFile(
        fileExt === '.jpg' || fileExt === '.jpeg' ? errorJpg : errorSvg,
        options,
        (err) => {
          if (err) next(err);
        },
      );
    } catch (err) {
      return next(err);
    }
  }
}
