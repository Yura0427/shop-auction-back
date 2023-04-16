import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Delivery } from './delivery.entity';
import { User } from '../user/user.entity';
import { Order } from '../orders/orders.entity';
import { DeliveryDto } from './dto/delivery.dto';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  async createDelivery(userId: number, dto: DeliveryDto): Promise<Delivery> {
    const { cityName, streetName, deliveryMethod, courierDeliveryAddress } = dto;
    let delivery = await this.deliveryRepository.findOne({
      where: {
        cityName: cityName.trim(),
        streetName: streetName.trim(),
        deliveryMethod: deliveryMethod,
        courierDeliveryAddress: courierDeliveryAddress
      },
    });

    if (!delivery) {
      delivery = await this.deliveryRepository.save({ ...dto });
    }

    await this.userRepository.update(userId, {
      delivery,
    });

    return delivery;
  }
}
