import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/orders/orders.entity';
import { ProductToOrder } from 'src/product-to-order/product-to-order.entity';
import { Product } from 'src/product/product.entity';
import { User } from 'src/user/user.entity';
import { CheckboxService } from './checkbox.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
    ]),
  ],
  providers:[CheckboxService],
  exports: [CheckboxService]
})

export class CheckboxModule { }