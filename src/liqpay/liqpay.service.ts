import { Injectable, Logger } from '@nestjs/common';
import * as LiqPay from 'liqpayjs-sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Namespace } from 'socket.io';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

import { Order } from 'src/orders/orders.entity';
import { P2PPaymentDto } from './dto/p2p-payment.dto';
import { CallbackDto } from './dto/callback.dto';
import { Status } from '../orders/orderStatus.enum';
import { CheckboxService } from '../checkbox/checkbox.service';
import { User } from '../user/user.entity';
import { BotService } from '../telegram-bot/bot.service';
import { MailService } from '../mail/mail.service';


@Injectable()
@WebSocketGateway({ cors: true })
export class LiqpayService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private checkboxService: CheckboxService,
    private botService: BotService,
    private readonly mailService: MailService,
  ) {}

  @WebSocketServer()
  server: Namespace;

  private liqpay = new LiqPay(
    process.env.PUBLIC_KEY_LIQPAY,
    process.env.PRIVATE_KEY_LIQPAY,
  );

  public async getPaymentStatusAndSaveInfo(orderId) {
    let existingProductToOrder = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    this.liqpay.api(
      'request',
      {
        action: 'status',
        version: '3',
        order_id: orderId,
      },
      async (json) => {
        if (existingProductToOrder) {
          let paymentStatus: boolean = false;
          if (json.status === 'success') paymentStatus = true;
          await this.orderRepository.update(
            { id: orderId },
            {
              liqpayOrderId: json.liqpay_order_id,
              liqpayPaymentStatus: json.status,
              paymentStatus,
            },
          );
        }
      },
    );
  }

  public p2pPayment(dto: P2PPaymentDto) {
    const {
      phone,
      amount,
      currency,
      description,
      orderId,
      card,
      cardExpMonth,
      cardExpYear,
      cardCVV,
    } = dto;

    this.liqpay.api(
      'request',
      {
        action: 'p2p',
        version: '3',
        phone,
        amount,
        currency,
        description,
        order_id: orderId,
        receiver_card: process.env.RECEIVER_CARD_LIQPAY,
        card,
        card_exp_month: cardExpMonth,
        card_exp_year: cardExpYear,
        card_cvv: cardCVV,
      },
      (json) => Logger.log(`Payment status: ${json.status}`),
    );
  }

  public async callback(dto: CallbackDto) {
    const dataFromLiqpay = JSON.parse(
      Buffer.from(dto.data, 'base64').toString('utf-8'),
    );

    const existingProductToOrder = await this.orderRepository.findOne({
      where: { orderIdForLiqpay: dataFromLiqpay.order_id },
      relations: [
        'user',
        'delivery',
        'productToOrder',
        'productToOrder.product',
        'productToOrder.product.mainImg',
      ],
    });

    if (existingProductToOrder?.isSentByCheckbox) {
      return;
    }

    if (existingProductToOrder) {
      let paymentStatus: boolean = false;
      if (dataFromLiqpay?.status === 'success') paymentStatus = true;
      if (paymentStatus) {
        const updateData = await this.orderRepository.update(
          { orderIdForLiqpay: dataFromLiqpay.order_id },
          {
            status: Status.PENDING,
            liqpayOrderId: dataFromLiqpay.liqpay_order_id,
            liqpayPaymentStatus: dataFromLiqpay.status,
            isSentByCheckbox: true,
            paymentStatus,
          },
        );
        
        this.server.emit('awaitCallback', updateData);

        try {
          try {
            await this.checkboxService.cashierSignIn(existingProductToOrder.id);
          } catch (e) {
            console.log(
              '🚀 ~ file: liqpay.service.ts:143 ~ LiqpayService ~ e:',
              e,
            );
          }

          const {
            email,
            firstName,
            lastName,
            phoneNumber,
          } = await this.userRepository.findOne(existingProductToOrder.user.id);

          const {
            additionalFirstName,
            additionalLastName,
            additionalEmail,
            additionalNumber,
            comment,
            notcall,
          } = existingProductToOrder;
          const paymentMethod = 'LiqPay';

          try {
            await this.mailService.sendEmailWithSuccessOrder(
              additionalEmail || email,
              additionalFirstName || firstName,
              additionalNumber || phoneNumber,
              existingProductToOrder,
              existingProductToOrder.delivery,
            );
          } catch (e) {
            console.log(
              '🚀 ~ file: liqpay.service.ts:175 ~ LiqpayService ~ e:',
              e,
            );
          }

          try {
            const { amount, productToOrder } = existingProductToOrder;

            await this.botService.sendMessageAllAdmins({
              userName: `${additionalFirstName ? additionalFirstName : firstName}
               ${additionalLastName ? additionalLastName : lastName}`,
              numberGoods: productToOrder.length,
              orderPrice: amount,
            });
          } catch (e) {
            console.log(
              '🚀 ~ file: liqpay.service.ts:192 ~ LiqpayService ~ e:',
              e,
            );
          }
        } catch (e) {
          console.log(e);
        }
      } else {
        const orderIdForLiqpay = uuidv4();
        const updateData = await this.orderRepository.update(
          { orderIdForLiqpay: dataFromLiqpay.order_id },
          {
            liqpayOrderId: dataFromLiqpay.liqpay_order_id,
            liqpayPaymentStatus: dataFromLiqpay.status,
            paymentStatus,
            orderIdForLiqpay,
          },
        );
        this.server.emit('awaitCallback', updateData);
      }
    }
  }
}
