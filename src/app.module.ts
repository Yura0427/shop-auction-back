import {
  CacheModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { APP_FILTER } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { RatingsModule } from './ratings/ratings.module';
import { UserModule } from './user/user.module';
import { OrdersModule } from './orders/orders.module';
import { ParametersModule } from './parameters/parameters.module';
import { CharacteristicsModule } from './characteristics/characteristics.module';
import { CharacteristicsValuesModule } from './characteristics-values/characteristics-values.module';
import { LikeModule } from './likes/like.module';
import { SlideModule } from './slide/slide.module';
import { FiltersModule } from './filters/filters.module';
import { RoleModule } from './user/role/role.module';
import { CommentsModule } from './comments/comments.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import { FilesModule } from './files/files.module';
import { MailModule } from 'src/mail/mail.module';
import { ImageUtilsModule } from './image/image-utils.module';
import { BotModule } from './telegram-bot/bot.module';
import { ShopParserModule } from './shop-parser/shop-parser.module';
import { DeliveryModule } from './delivery/delivery.module';
import { ToolsModule } from './tools/tools.module';
import { SearchModule } from './search/search.module';
import { InvoiceModule } from './invoice/invoice.module';
import * as path from 'path';
import { SliderAnimationsModule } from './slider-animations/slider-animations.module';
import { LiqpayModule } from './liqpay/liqpay.module';
import { ColorsPicturesModule } from './colors-pictures/colors-pictures.module';
import { logModuleConfig } from './configs/logger/log-module-config';
import { TraceRequestMiddleware } from './middlewares/traceRequests.middleware';
import { LoggerExceptionsFilter } from './utils/logger/logger-exceptions.filter';
import { StaticModule } from './serv-static/servStatic.module';
import { AppGateway } from './app.gateway';
import { UserSessionCache } from './utils/users-sessions/user-session-cache';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [
    StaticModule,
    TypeOrmModule.forRoot(),
    AuthModule,
    ShopParserModule,
    CategoryModule,
    ProductModule,
    RatingsModule,
    DeliveryModule,
    UserModule,
    OrdersModule,
    ParametersModule,
    CharacteristicsModule,
    CharacteristicsValuesModule,
    LikeModule,
    SlideModule,
    CommentsModule,
    FeedbacksModule,
    FiltersModule,
    RoleModule,
    FilesModule,
    MailModule,
    ImageUtilsModule,
    BotModule,
    ShopParserModule,
    SearchModule,
    ToolsModule,
    InvoiceModule,
    SliderAnimationsModule,
    LiqpayModule,
    ColorsPicturesModule,
    WinstonModule.forRoot(logModuleConfig),
    CacheModule.register({
      isGlobal: true,
    }),
    SocketModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: LoggerExceptionsFilter,
    },
    AppGateway,
    UserSessionCache,
  ],
  exports: [CacheModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceRequestMiddleware).forRoutes('*');
  }
}
