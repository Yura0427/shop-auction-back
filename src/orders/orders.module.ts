import { Parameters } from './../parameters/parameters.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { OrdersService } from './orders.service';
import { Order } from './orders.entity';
import { OrdersController } from './orders.controller';
import { Product } from 'src/product/product.entity';
import { User } from 'src/user/user.entity';
import { ProductToOrder } from 'src/product-to-order/product-to-order.entity';
import { BotModule } from '../telegram-bot/bot.module';
import { MailModule } from '../mail/mail.module';
import { Delivery } from '../delivery/delivery.entity';
import { jwtConfig } from '../configs/jwt/jwt-module-config';
import { CheckboxModule } from 'src/checkbox/checkbox.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      Product,
      User,
      ProductToOrder,
      Delivery,
      Parameters,
    ]),
    BotModule,
    MailModule,
    CheckboxModule,
    JwtModule.register(jwtConfig),
  ],
  exports: [TypeOrmModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
