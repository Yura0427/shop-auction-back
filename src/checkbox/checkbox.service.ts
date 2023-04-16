import {
  HttpException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import * as cron from 'node-cron';
import * as retry from 'bluebird-retry';
import { Order } from 'src/orders/orders.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CheckboxService implements OnModuleInit {
  private url = process.env.API_CHECKBOX;
  private timeToClose = '23:55:00';

  async onModuleInit() {
    const isOpenShift = await (await this.isOpenShifts()).data;
    const date = new Date();
    const timeNow = date.toLocaleString('en-US', {
      timeZone: 'Europe/Kiev',
      timeStyle: 'medium',
      hour12: false,
    });

    this.timeToClose > timeNow
      ? this.openShifts()
      : isOpenShift && this.closeShifts();
    cron.schedule('00 00 00 * * *', () => this.openShifts(), {
      timezone: 'Europe/Kiev',
      scheduled: true,
    });
    cron.schedule('00 55 23 * * *', () => this.closeShifts(), {
      timezone: 'Europe/Kiev',
      scheduled: true,
    });
  }

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  private async isOpenShifts() {
    try {
      const cashier = await axios.post(`${this.url}/cashier/signin`, {
        login: process.env.CASHIER_LOGIN_CHECKBOX,
        password: process.env.CASHIER_PASSWORD_CHECKBOX,
      });

      if (!cashier.data.access_token) {
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${cashier.data.access_token}`,
          'X-License-Key': process.env.X_LICENSE_KEY_CHECKBOX,
        },
      };
      const { data } = await axios.get(`${this.url}/cashier/shift`, config);

      return { data, config };
    } catch (error) {
      throw new HttpException(
        `${error.response.data.message}`,
        error.response.status,
      );
    }
  }

  private async openShifts() {
    try {
      let shift;
      const isOpenShift = await (await this.isOpenShifts()).data;
      const config = await (await this.isOpenShifts()).config;

      if (isOpenShift === null) {
        const { data } = await axios.post(`${this.url}/shifts`, {}, config);
        shift = data;
      } else shift = isOpenShift;

      return shift;
    } catch (error) {
      throw new HttpException(
        `${error.response?.data?.message}`,
        error.response?.status,
      );
    }
  }

  private async closeShifts() {
    try {
      const config = await (await this.isOpenShifts()).config;

      await axios.post(`${this.url}/reports`, {}, config);
      await axios.post(`${this.url}/shifts/close`, {}, config);
    } catch (error) {
      throw new HttpException(
        `${error.response.data.message}`,
        error.response.status,
      );
    }
  }

  public async cashierSignIn(orderId) {
    const order = await this.ordersRepository
      .createQueryBuilder('order')
      .select()
      .where('order.id = :id', { id: orderId })
      .orderBy('order.createdAt', 'ASC')
      .leftJoinAndSelect('order.productToOrder', 'productToOrder')
      .leftJoin('productToOrder.product', 'product')
      .addSelect([
        'product.id',
        'product.name',
        'product.key',
        'product.price',
        'product.url',
      ])
      .leftJoin('order.user', 'user')
      .addSelect('user.email')
      .getOne();

    if (!order) {
      throw new NotFoundException(`Замовлення з ID: ${orderId} не знайдено`);
    }

    const { productToOrder, user } = order;

    const goods = productToOrder.map((pto) => ({
      good: {
        code: pto.product.id,
        name: pto.product.name,
        price: pto.product.price * 100,
      },
      quantity: pto.quantity * 1000,
      discounts: [],
    }));

    try {
      const config = await (await this.isOpenShifts()).config;
      const organizationData = await axios.get(
        `${this.url}/cashier/me`,
        config,
      );
      const isShiftExist = await axios.get(`${this.url}/cashier/shift`, config);

      let shiftId = await (await this.openShifts()).id;

      const data = {
        id: uuidv4(),
        cashier_name: organizationData.data.full_name,
        departament: organizationData.data.organization.title,
        goods: [...goods],
        delivery: {
          email: user.email,
          emails: [user.email],
        },
        payments: [
          {
            type: 'CASHLESS',
            value: order.amount * 100,
          },
        ],
      };

      const createReceipt = async () => {
        const getShift = await axios.get(
          `${this.url}/shifts/${shiftId}`,
          config,
        );
        if (getShift.data.status === 'OPENED') {
          await axios.post(`${this.url}/receipts/sell`, data, config);
          return Promise.resolve(
            'The shift is open, the check request has been sent...',
          );
        } else if (getShift.data.status === 'CLOSED') {
          const shifts = await axios.post(`${this.url}/shifts`, {}, config);
          shiftId = shifts.data.id;
          return Promise.reject(
            'Shift is not open, re-request to open shift...',
          );
        } else {
          return Promise.reject('Waiting for the opening of the shift...');
        }
      };
      await retry(createReceipt, {
        timeout: 25000,
        interval: 10,
        backoff: 2,
        throw_original: true,
      }).caught(async (e) => {
        console.log(
          e,
          '\n checkRequest is sent, if there is an error, this will be reported in the response...',
        );
        return await axios.post(`${this.url}/receipts/sell`, data, config);
      });

      const shiftStatus = await axios.get(
        `${this.url}/shifts/${shiftId}`,
        config,
      );

      let date = new Date();
      const timeNow = date.toLocaleString('en-US', {
        timeZone: 'Europe/Kiev',
        timeStyle: 'medium',
        hour12: false,
      });

      if (shiftStatus.data.status === 'OPENED' && this.timeToClose < timeNow) {
        this.closeShifts();
      }
    } catch (error) {
      throw new HttpException(
        `${error.response.data.message}`,
        error.response.status,
      );
    }
  }
}
