import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiqpayController } from './liqpay.controller';
import { LiqpayService } from './liqpay.service';
import { Order } from 'src/orders/orders.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '../configs/jwt/jwt-module-config';
import { User } from '../user/user.entity';
import { CheckboxModule } from '../checkbox/checkbox.module';
import { BotModule } from '../telegram-bot/bot.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User]),
    LiqpayModule,
    BotModule,
    MailModule,
    CheckboxModule,
    JwtModule.register(jwtConfig),
  ],
  providers: [LiqpayService],
  controllers: [LiqpayController],
  exports: [TypeOrmModule],
})
export class LiqpayModule {}
