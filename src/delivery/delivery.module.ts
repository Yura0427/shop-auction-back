import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { Delivery } from './delivery.entity';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { Order } from '../orders/orders.entity';
import { User } from '../user/user.entity';
import { jwtConfig } from '../configs/jwt/jwt-module-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery, User, Order]),
    JwtModule.register(jwtConfig),
  ],
  providers: [DeliveryService],
  controllers: [DeliveryController],
  exports: [TypeOrmModule],
})
export class DeliveryModule {}
