import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { ImageUtilsService } from 'src/image/image-utils.service';
import { fileCheckerMiddleware } from './servStatic.middelware';


const servStatic = ServeStaticModule.forRoot({
  rootPath: path.resolve(process.env.IMG_PATH),
  serveRoot: process.env.SERVE_ROOT,
  exclude: ['/api*']
});

@Module({
  imports: [servStatic],
  providers: [ImageUtilsService],
})

export class StaticModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(fileCheckerMiddleware).forRoutes('/static/uploads/:file');
  }
}

