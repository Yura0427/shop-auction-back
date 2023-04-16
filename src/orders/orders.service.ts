import { ParametersNameEnum } from './../parameters/parameters.enum';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from './orders.entity';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateProductInOrderDto } from './dto/update-product-in-order.dto';
import { Status } from './orderStatus.enum';
import { CustomValidation } from 'src/utils/custom-validation';
import { getTotalPages } from 'src/utils/get-total-pages';
import { PaginatedOrdersDto } from './dto/paginated-orders.dto';
import { PaginationDto } from '@shared/pagination.dto';
import { Product } from 'src/product/product.entity';
import { User } from 'src/user/user.entity';
import { Parameters } from '../parameters/parameters.entity';
import { ProductToOrder } from 'src/product-to-order/product-to-order.entity';
import { UpdateOrderAdminDto } from 'src/orders/dto/update-order-admin.dto';
import { UpdateOrderDto } from 'src/orders/dto/update-order.dto';
import { AddOrderDto } from './dto/add-order.dto';
import { MailService } from '../mail/mail.service';
import { BotService } from 'src/telegram-bot/bot.service';
import { Delivery } from '../delivery/delivery.entity';
import { ToPendingDto } from './dto/toPending.dto';
import { paginationBySearchDTO } from './dto/pagination-by-serch.dto';
import { IOrdersByDateRange } from '../interfaces/ordersByDateRange.interface';
import { CheckboxService } from 'src/checkbox/checkbox.service';
import { v4 as uuidv4 } from 'uuid';
import { UpdatePaymentStatusDto } from './dto/updatePaymentStatus.dto';

const userFields = [
  'user.id',
  'user.firstName',
  'user.lastName',
  'user.email',
  'user.phoneNumber',
  'user.dateOfBirth',
  'user.googleId',
  'user.facebookId',
  'user.userWallet',
];

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductToOrder)
    private productToOrderRepository: Repository<ProductToOrder>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject('BotService')
    private botService: BotService,
    private readonly mailService: MailService,
    private checkboxService: CheckboxService,
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    @InjectRepository(Parameters)
    private parametersRepository: Repository<Parameters>,
  ) {}

  public async getOrders(
    paginationDto: PaginationDto,
  ): Promise<PaginatedOrdersDto> {
    const page = Number(paginationDto.page);
    const limit = Number(paginationDto.limit) || 10;
    const skippedItems = (page - 1) * limit || 0;

    const [data, count]: [
      Order[],
      number,
    ] = await this.ordersRepository
      .createQueryBuilder('order')
      .select()
      .where('order.status != :status', { status: Status.OPEN })
      .orderBy('order.createdAt', 'DESC')
      .leftJoinAndSelect('order.productToOrder', 'productToOrder')
      .leftJoin('productToOrder.product', 'product')
      .addSelect(['product.id', 'product.name', 'product.key', 'product.price'])
      .leftJoin('product.mainImg', 'mainImg')
      .addSelect('mainImg.name')
      .leftJoin('product.category', 'category')
      .addSelect(['category.id', 'category.name', 'category.key'])
      .leftJoin('order.user', 'user')
      .addSelect(userFields)
      .leftJoin('order.delivery', 'delivery')
      .addSelect([
        'delivery.areaName',
        'delivery.cityName',
        'delivery.cityFullName',
        'delivery.cityRef',
        'delivery.streetName',
        'delivery.streetRef',
        'delivery.deliveryMethod',
        'delivery.courierDeliveryAddress',
      ])
      .take(limit)
      .skip(skippedItems)
      .getManyAndCount();

    const totalPages = getTotalPages(count, limit, page);

    return { data, count, totalPages };
  }

  public async getOrdersBySearchParams(
    paginationBySearchDTO: paginationBySearchDTO,
  ) {
    const page = Number(paginationBySearchDTO.page);
    const limit = Number(paginationBySearchDTO.limit) || 10;
    const searchValue: string = paginationBySearchDTO.searchValue;
    const skippedItems = (page - 1) * limit || 0;

    const order = await this.getOrderByIdWithoutError(+searchValue);

    if (order) {
      return { data: [order], count: 1, totalPages: 1 };
    }

    const [data, count] = await this.getOrdersByPhoneNumber(
      searchValue,
      limit,
      skippedItems,
    );

    const totalPages = getTotalPages(count, limit, page);

    return { data, count, totalPages };
  }

  public async getOrderByIdWithoutError(id: number): Promise<Order> {
    return await this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.productToOrder', 'productToOrder')
      .leftJoin('productToOrder.product', 'product')
      .addSelect(['product.id', 'product.name', 'product.key', 'product.price'])
      .leftJoin('product.category', 'category')
      .addSelect(['category.id', 'category.name', 'category.key'])
      .leftJoin('product.mainImg', 'mainImg')
      .addSelect('mainImg.name')
      .leftJoin('order.user', 'user')
      .addSelect(userFields)
      .leftJoin('order.delivery', 'delivery')
      .addSelect([
        'delivery.areaName',
        'delivery.cityName',
        'delivery.cityFullName',
        'delivery.cityRef',
        'delivery.streetName',
        'delivery.streetRef',
        'delivery.deliveryMethod',
        'delivery.courierDeliveryAddress',
      ])
      .where('order.id = :id', { id: id })
      .getOne();
  }

  public async getOrdersByPhoneNumber(searchValue, limit, skippedItems) {
    return await this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.productToOrder', 'productToOrder')
      .leftJoin('productToOrder.product', 'product')
      .addSelect(['product.id', 'product.name', 'product.key', 'product.price'])
      .leftJoin('product.category', 'category')
      .addSelect(['category.id', 'category.name', 'category.key'])
      .leftJoin('product.mainImg', 'mainImg')
      .addSelect('mainImg.name')
      .leftJoin('order.user', 'user')
      .addSelect(userFields)
      .leftJoin('order.delivery', 'delivery')
      .addSelect([
        'delivery.areaName',
        'delivery.cityName',
        'delivery.cityFullName',
        'delivery.cityRef',
        'delivery.streetName',
        'delivery.streetRef',
        'delivery.deliveryMethod',
        'delivery.courierDeliveryAddress',
      ])
      .where('order.additionalNumber like :additionalNumber', {
        additionalNumber: `%${searchValue}%`,
      })
      .orWhere('user.phoneNumber like :phoneNumber', {
        phoneNumber: `%${searchValue}%`,
      })
      .orderBy('order.createdAt', 'DESC')
      .take(limit)
      .skip(skippedItems)
      .getManyAndCount();
  }

  public async getOrdersByDate(
    range: string[],
    condition: string[],
  ): Promise<IOrdersByDateRange[]> {
    let temp = [];
    let datesArr = [];
    let resultData = [];

    await Promise.all(
      condition.map(async () => {
        const data = await this.ordersRepository
          .createQueryBuilder('orders')
          .select([
            "to_char(orders.createdAt, 'YYYY-MM-DD') as date",
            'orders.amount',
            'orders.paymentStatus',
          ])
          .where('orders.createdAt between :dateStart and :dateStop', {
            dateStart: range[0],
            dateStop: range[1],
          })
          .groupBy('date , orders.paymentStatus , orders.amount')
          .orderBy('date', 'ASC')
          .getRawMany();
           temp = data
      }),
    );

    if (temp.length) {
      temp.forEach((elem) => {
        if (!datesArr.includes(elem.date)) datesArr.push(elem.date);
      });
      datesArr.sort(
        (a, b) =>
          +new Date(a.split('-')[0], a.split('-')[1], a.split('-')[2]) -
          +new Date(b.split('-')[0], b.split('-')[1], b.split('-')[2]),
      );
    }

    datesArr.forEach((elem) => {
      let element = {
        date: elem,
        paid: temp.filter(el=> el.date === elem && el.orders_paymentStatus === true).length.toString() || '0',
        notpaid: temp.filter(el=> el.date === elem && el.orders_paymentStatus === false).length.toString() || '0',
        paidSum: temp.filter(el=> el.date === elem && el.orders_paymentStatus === true).reduce((ac,val)=> {
            return ac + val.orders_amount
        },0).toString() || '0',
        notPaidSum: temp.filter(el=> el.date === elem && el.orders_paymentStatus === false).reduce((ac,val)=> {
            return ac + val.orders_amount
        },0).toString() || '0',
      };
      temp.forEach((e) => {
        if (elem === e.date) {
          element = { ...element};
        }
      });
      resultData.push(element);
    });

    if (!resultData.length)
      throw new HttpException(
        'Дані за обраний період відсутні',
        HttpStatus.NOT_FOUND,
      );
    return resultData;
  }

    public async getOrdersStatusByDate(
        range: string[],
        condition: string[],
    ): Promise<IOrdersByDateRange[]> {
        let temp = [];
        let datesArr = [];
        let resultData = [];
        await Promise.all(
            condition.map(async (status) => {
                const data = await this.ordersRepository
                    .createQueryBuilder('orders')
                    .select([
                        "to_char(orders.createdAt, 'YYYY-MM-DD') as date",
                        'orders.amount',
                        'orders.status',
                    ])
                    .where('orders.createdAt between :dateStart and :dateStop', {
                        dateStart: range[0],
                        dateStop: range[1],
                    })
                    .groupBy('date , orders.status, orders.amount')
                    .orderBy('date', 'ASC')
                    .getRawMany();
                temp = data.filter(el=> el.orders_status === 'cancelled' || el.orders_status === 'completed')
            }),
        );
        if (temp.length) {
            temp.forEach((elem) => {
                if (!datesArr.includes(elem.date)) datesArr.push(elem.date);
            });
            datesArr.sort(
                (a, b) =>
                    +new Date(a.split('-')[0], a.split('-')[1], a.split('-')[2]) -
                    +new Date(b.split('-')[0], b.split('-')[1], b.split('-')[2]),
            );
        }

        datesArr.forEach((elem) => {
            let element = {
                date: elem,
                completed: temp.filter(el=> el.date === elem && el.orders_status === 'completed').length.toString() || '0',
                cancelled: temp.filter(el=> el.date === elem && el.orders_status === 'cancelled').length.toString() || '0',
                completedSum: temp.filter(el=> el.date === elem && el.orders_status === 'completed').reduce((ac,val)=> {
                    return ac + val.orders_amount
                },0).toString() || '0',
                cancelledSum: temp.filter(el=> el.date === elem && el.orders_status === 'cancelled').reduce((ac,val)=> {
                    return ac + val.orders_amount
                },0).toString() || '0',
            };
            temp.forEach((e) => {
                if (elem === e.date) {
                    element = { ...element};
                }
            });
            resultData.push(element);
        });
        if (!resultData.length)
            throw new HttpException(
                'Дані за обраний період відсутні',
                HttpStatus.NOT_FOUND,
            );
        return resultData;
    }

  public async getUserOrders(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedOrdersDto> {
    const page = Number(paginationDto.page);
    const limit = Number(paginationDto.limit) || 10;
    const skippedItems = (page - 1) * limit || 0;

    const [data, count]: [
      Order[],
      number,
    ] = await this.ordersRepository
      .createQueryBuilder('order')
      .select()
      .where('order.user = :id', { id: userId })
      .andWhere('order.status != :status', { status: Status.OPEN })
      .orderBy('order.createdAt', 'DESC')
      .leftJoinAndSelect('order.productToOrder', 'productToOrder')
      .leftJoin('productToOrder.product', 'product')
      .addSelect([
        'product.id',
        'product.name',
        'product.key',
        'product.url',
        'product.price',
        'product.discountedPrice',
        'product.avgRating',
      ])
      .leftJoin('product.mainImg', 'mainImg')
      .addSelect('mainImg.name')
      .leftJoin('product.category', 'category')
      .addSelect(['category.id', 'category.name', 'category.key'])
      .leftJoin('order.delivery', 'delivery')
      .addSelect([
        'delivery.cityFullName',
        'delivery.streetName',
        'delivery.deliveryMethod',
        'delivery.courierDeliveryAddress',
      ])
      .take(limit)
      .skip(skippedItems)
      .getManyAndCount();

    const totalPages = getTotalPages(count, limit, page);

    return { data, count, totalPages };
  }

  async getUserCart(userId: number): Promise<Order> {
    return await this.ordersRepository
      .createQueryBuilder('order')
      .select()
      .where('order.user = :id', { id: userId })
      .andWhere('order.status = :status', { status: Status.OPEN })
      .leftJoinAndSelect('order.productToOrder', 'productToOrder')
      .leftJoin('productToOrder.product', 'product')
      .addSelect([
        'product.id',
        'product.name',
        'product.key',
        'product.url',
        'product.price',
        'product.discountedPrice',
        'product.avgRating',
        'product.shopKey',
      ])
      .leftJoin('product.mainImg', 'mainImg')
      .addSelect('mainImg.name')
      .leftJoin('product.category', 'category')
      .addSelect(['category.id', 'category.name', 'category.key'])
      .getOne();
  }

  async getOrderById(id: number): Promise<Order> {
    const order = await this.ordersRepository
      .createQueryBuilder('order')
      .select()
      .where({ id })
      .orderBy('order.createdAt', 'ASC')
      .leftJoinAndSelect('order.productToOrder', 'productToOrder')
      .leftJoin('productToOrder.product', 'product')
      .addSelect([
        'product.id',
        'product.name',
        'product.key',
        'product.price',
        'product.url',
        'product.nameInProvider',
        'product.shopKey',
      ])
      .leftJoin('product.mainImg', 'mainImg')
      .addSelect('mainImg.name')
      .leftJoinAndSelect('product.characteristicValue', 'characteristicValue')
      .leftJoin('product.category', 'category')
      .addSelect(['category.id', 'category.name', 'category.key'])
      .leftJoin('order.user', 'user')
      .addSelect(userFields)
      .leftJoin('order.delivery', 'delivery')
      .addSelect([
        'delivery.areaName',
        'delivery.cityName',
        'delivery.cityFullName',
        'delivery.cityRef',
        'delivery.streetName',
        'delivery.streetRef',
        'delivery.deliveryMethod',
        'delivery.courierDeliveryAddress',
      ])
      .getOne();

    new CustomValidation().notFound('Замовлення', 'ID', id, order);
    return order;
  }

  async getOrderByIdWithoutAuth(orderId: number): Promise<Order> {
    const order = await this.ordersRepository
      .createQueryBuilder('order')
      .select(['order.id', 'order.status', 'order.amount'])
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
      .leftJoin('product.mainImg', 'mainImg')
      .addSelect('mainImg.name')
      .leftJoinAndSelect('product.characteristicValue', 'characteristicValue')
      .leftJoin('product.category', 'category')
      .addSelect(['category.id', 'category.name', 'category.key'])
      .leftJoin('order.delivery', 'delivery')
      .addSelect([
        'delivery.areaName',
        'delivery.cityName',
        'delivery.cityFullName',
        'delivery.cityRef',
        'delivery.deliveryMethod',
        'delivery.courierDeliveryAddress',
      ])
      .getOne();

    new CustomValidation().notFound('Замовлення', 'ID', orderId, order);
    return order;
  }

  public async addOrder(dto: AddOrderDto, userId: number): Promise<Order> {
    const { orderValues, singleProduct } = dto;

    const orderIdForLiqpay = uuidv4();

    let existingOrder = await this.ordersRepository.findOne({
      where: { user: userId, status: Status.OPEN },
    });

    if (existingOrder?.liqpayPaymentStatus === 'success') {
      throw new HttpException(
        'Є оплачені але не оформлені товари',
        HttpStatus.NOT_FOUND,
      );
    }

    const user = await this.userRepository.findOne(userId);

    if (existingOrder && existingOrder.orderIdForLiqpay === null) {
      await this.ordersRepository.update(
        { id: existingOrder.id },
        {
          orderIdForLiqpay,
        },
      );
    }

    if (singleProduct) {
      const { id: productId, ...selected } = singleProduct;

      const product = await this.productRepository.findOne(productId);
      new CustomValidation().notFound('Продукт', 'ID', productId, product);

      const totalSum = orderValues?.reduce(
        (result, item) =>
          item.product.discountedPrice
            ? result + item.product.discountedPrice
            : result + item.product.price,
        0,
      );

      if (!existingOrder) {
        existingOrder = await this.ordersRepository.save({
          user,
          status: Status.OPEN,
          amount: productId
            ? product.discountedPrice || product.price
            : totalSum,
          amountWithoutDiscount: productId && product.price,   
          orderIdForLiqpay,
        });
      } else {
        await this.ordersRepository.update(
          { id: existingOrder.id },
          {
            amount:
              existingOrder.amount +
              (productId ? product.discountedPrice || product.price : totalSum),
            amountWithoutDiscount:
              existingOrder.amountWithoutDiscount +
              (productId && product.price),
          },
        );
      }

      if (productId) {
        const orderProduct = await this.productToOrderRepository.findOne({
          where: { product: productId, order: existingOrder.id },
        });

        if (orderProduct) {
          await this.productToOrderRepository.update(
            { id: orderProduct.id },
            {
              quantity: orderProduct.quantity + 1,
              amount:
                orderProduct.amount + (product.discountedPrice || product.price),
              amountWithoutDiscount: orderProduct.amountWithoutDiscount + product.price,
              order: existingOrder,
              ...selected,
            },
          );
        } else {
          await this.productToOrderRepository.save({
            quantity: 1,
            amount: product.discountedPrice || product.price,
            amountWithoutDiscount: product.price,
            order: existingOrder,
            product,
            ...selected,
          });
        }

        return this.getUserCart(userId);
      }
    }

    if (orderValues && orderValues.length) {
      const productsOrdersCreate = [];
      const amount = orderValues.reduce(
        (prev, current) =>
          (prev +=
            current.quantity *
            (current.product.discountedPrice || current.product.price)),
        0,
      );

      const amountWithoutDiscount = orderValues.reduce(
        (prev, current) =>
          (prev += current.quantity * current.product.price),
        0,
      );

      if (!existingOrder) {
        existingOrder = await this.ordersRepository.save({
          user,
          status: Status.OPEN,
          amount,
          amountWithoutDiscount,
          orderIdForLiqpay,
        });
      } else {
        await this.ordersRepository.update(
          { id: existingOrder.id },
          {
            amount: existingOrder.amount + amount,
            amountWithoutDiscount: existingOrder.amountWithoutDiscount + amountWithoutDiscount,
          },
        );
      }

      for (let i = 0; i < orderValues.length; i++) {
        let orderValue = orderValues[i];
        const { product, quantity, size, color } = orderValue;

        const objToFind: any = { product, order: existingOrder.id };

        if (size) {
          objToFind.size = size;
        }

        if (color) {
          objToFind.color = color;
        }

        const existingProductToOrder = await this.productToOrderRepository.findOne(
          {
            where: objToFind,
          },
        );

        !existingProductToOrder
          ? productsOrdersCreate.push({
              color,
              size,
              order: existingOrder,
              product,
              quantity: quantity,
              amount: quantity * (product.discountedPrice || product.price),
              amountWithoutDiscount : quantity * product.price,
            })
          : await this.productToOrderRepository.update(
              { id: existingProductToOrder.id },
              {
                color,
                size,
                quantity: existingProductToOrder.quantity + quantity,
                amount:
                existingProductToOrder.amount + quantity * (product.discountedPrice || product.price),
                amountWithoutDiscount: existingProductToOrder.amountWithoutDiscount + quantity * product.price,
              },
            );
      }

      await this.productToOrderRepository.save(productsOrdersCreate);
      return this.getUserCart(userId);
    }
  }

  private async updateProductInOrder(
    productInCart: ProductToOrder,
    sum: number,
    sumWithoutDiscount: number,
  ): Promise<ProductToOrder> {
    const res = await this.ordersRepository.update(
      { id: productInCart.order.id },
      {
        amount: sum,
        amountWithoutDiscount: sumWithoutDiscount,
      },
    );

    if (!res.affected) {
      throw new NotFoundException(
        `Замовлення з ID: ${productInCart.order.id} не знайдено`,
      );
    }

    return this.productToOrderRepository
      .createQueryBuilder('productToOrder')
      .select()
      .where({ id: productInCart.id })
      .leftJoin('productToOrder.product', 'product')
      .addSelect([
        'product.id',
        'product.name',
        'product.key',
        'product.price',
        'product.discountedPrice',
        'product.url',
        'product.avgRating',
      ])
      .leftJoin('product.mainImg', 'mainImg')
      .addSelect('mainImg.name')
      .leftJoin('product.category', 'category')
      .addSelect(['category.id', 'category.name', 'category.key'])
      .getOne();
  }

  private async getProductToOrderByOrderIdAndProductId({
    orderId,
    productId,
  }: {
    orderId: number;
    productId: number;
  }): Promise<ProductToOrder> {
    const productToOrder = await this.productToOrderRepository
      .createQueryBuilder('orderProduct')
      .leftJoinAndSelect('orderProduct.order', 'order')
      .where('order.id = :orderId', { orderId })
      .leftJoinAndSelect('orderProduct.product', 'product')
      .andWhere('product.id = :productId', { productId })
      .getOne();

    return productToOrder;
  }

  private async getOrderSum(orderId: number): Promise<any> {
    const { sum, sumWithoutDiscount } = await this.productToOrderRepository
      .createQueryBuilder('productToOrder')
      .select('SUM(amount)', 'sum')
      .addSelect('SUM(productToOrder.amountWithoutDiscount)', 'sumWithoutDiscount')
      .where('productToOrder.order.id = :id', { id: orderId })
      .getRawOne();

    if (!sum) {
      const message = `Замовлення з ID ${orderId} не знайдено`;
      throw new NotFoundException(message);
    }

    return {sum, sumWithoutDiscount};
  }

  private async recalculateOrderSum(orderId: number): Promise<void> {
    const {sum, sumWithoutDiscount} = await this.getOrderSum(orderId);

    await this.ordersRepository.update(
      { id: orderId },
      { amount: sum, amountWithoutDiscount: sumWithoutDiscount },
    );
  }

  private async getProductToOrderById(id: number): Promise<ProductToOrder> {
    const productToOrder = await this.productToOrderRepository
      .createQueryBuilder('productToOrder')
      .select()
      .where({ id })
      .leftJoinAndSelect('productToOrder.product', 'product')
      .addSelect([
        'product.id',
        'product.name',
        'product.key',
        'product.price',
        'product.discountedPrice',
        'product.url',
        'product.avgRating',
      ])
      .leftJoinAndSelect('product.characteristicValue', 'characteristicValue')
      .leftJoin('product.mainImg', 'mainImg')
      .addSelect('mainImg.name')
      .leftJoin('product.category', 'category')
      .addSelect(['category.id', 'category.name', 'category.key'])
      .getOne();

    new CustomValidation().notFound(
      'Товар в замовленні',
      'ID',
      id,
      productToOrder,
    );

    return productToOrder;
  }

  public async updateCart(
    userId: number,
    productId: number,
    dto: UpdateOrderDto,
  ): Promise<ProductToOrder> {
    const { quantity, color, size, orderProductId, ...selected } = dto;

    const checkedColor = color ? color : null;
    const checkedSize = size ? size : null;

    const colorQuery = color
      ? 'orderProduct.color = :checkedColor'
      : { color: null };
    const sizeQuery = size
      ? 'orderProduct.size = :checkedSize'
      : { size: null };

    const productInCart = await this.productToOrderRepository
      .createQueryBuilder('orderProduct')
      .select()
      .where({ id: orderProductId })
      .leftJoinAndSelect('orderProduct.product', 'product')
      .where('product.id = :productId', { productId })
      .andWhere(colorQuery, { checkedColor })
      .andWhere(sizeQuery, { checkedSize })
      .leftJoinAndSelect('orderProduct.order', 'order')
      .andWhere('order.status = :status', { status: Status.OPEN })
      .getOne();

    const amount = quantity
      ? quantity * (productInCart.product.discountedPrice || productInCart.product.price)
      : productInCart.amount;
    
    const amountWithoutDiscount = quantity
      ? quantity * productInCart.product.price
      : productInCart.amountWithoutDiscount;

    const updatedQuantity = quantity ? quantity : productInCart.quantity;
    
    const result = await this.productToOrderRepository.update(
      { id: productInCart.id },
      { quantity: updatedQuantity, amount, amountWithoutDiscount, ...selected },
    );
    
    if (!result.affected) {
      throw new NotFoundException(
        `Продукт не знайдено у замовленні зі статусом 'Новий'`,
      );
    }

    const { sum, sumWithoutDiscount  } = await this.productToOrderRepository
      .createQueryBuilder('cart')
      .select('SUM(amount)', 'sum')
      .addSelect('SUM(cart.amountWithoutDiscount)', 'sumWithoutDiscount')
      .where('cart.order.id = :id', { id: productInCart.order.id })
      .getRawOne();

    return await this.updateProductInOrder(productInCart, sum, sumWithoutDiscount);
  }

  public async updateOrder(
    orderId: number,
    productId: number,
    UpdateOrderAdminDto: UpdateOrderAdminDto,
  ): Promise<ProductToOrder> {
    const productInCart = await this.getProductToOrderByOrderIdAndProductId({
      orderId,
      productId,
    });

    const productToOrderId = productInCart.id;
    const isNeedCalculateAmountOrder: boolean = !!UpdateOrderAdminDto.quantity;

    const productToOrderNewData: Partial<ProductToOrder> = {
      ...UpdateOrderAdminDto,
    };

    if (isNeedCalculateAmountOrder) {
      productToOrderNewData.amount =
        UpdateOrderAdminDto.quantity * (productInCart.amount / productInCart.quantity);
      productToOrderNewData.amountWithoutDiscount =
        UpdateOrderAdminDto.quantity * (productInCart.amountWithoutDiscount / productInCart.quantity);
    }

    const result = await this.productToOrderRepository.update(
      { id: productToOrderId },
      productToOrderNewData,
    );

    if (!result.affected) {
      throw new NotFoundException(
        `Продукт не знайдено у замовленні зі статусом 'Новий'`,
      );
    }

    if (isNeedCalculateAmountOrder) {
      await this.recalculateOrderSum(orderId);
    }

    return await this.getProductToOrderById(productToOrderId);
  }

  private removeSpacesAndPlus(additionalNumber: string): string {
    return additionalNumber.replace(/\D/g, '');
  }

  public async updateStatusToPending(
    userId: number,
    delivery: ToPendingDto,
  ): Promise<boolean> {
    const order = await this.ordersRepository.findOne({
      where: { user: userId, status: Status.OPEN },
      relations: [
        'productToOrder',
        'productToOrder.product',
        'productToOrder.product.mainImg',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Замовлення не знайдено`);
    }

    const {
      additionalFirstName,
      additionalLastName,
      additionalEmail,
      additionalNumber,
      comment,
      notcall,
      paymentMethod,
      ...deliveryFields
    } = delivery;

    if (paymentMethod === 'Післяплата') {
      try {
        const {
          email,
          firstName,
          lastName,
          phoneNumber,
        } = await this.userRepository.findOne(userId);

        const updatedOrder = await this.ordersRepository.update(order.id, {
          status: Status.PENDING,
          additionalFirstName,
          additionalLastName,
          additionalEmail,
          additionalNumber: additionalNumber
            ? this.removeSpacesAndPlus(additionalNumber)
            : additionalNumber,
          comment,
          notcall,
          delivery: deliveryFields,
          liqpayOrderId: null,
          liqpayPaymentStatus: null,
        });

        await this.mailService.sendEmailWithSuccessOrder(
          additionalEmail || email,
          additionalFirstName || firstName,
          additionalNumber || phoneNumber,
          order,
          delivery,
        );

        const { amount, productToOrder } = order;

        await this.botService.sendMessageAllAdmins({
          userName: `${additionalFirstName ? additionalFirstName : firstName}
             ${additionalLastName ? additionalLastName : lastName}`,
          numberGoods: productToOrder.length,
          orderPrice: amount,
        });

        return !!updatedOrder.affected;
      } catch (e) {
        console.log(e);
      }
    }

    const updatedOrder = await this.ordersRepository.update(order.id, {
      additionalFirstName,
      additionalLastName,
      additionalEmail,
      additionalNumber: additionalNumber
        ? this.removeSpacesAndPlus(additionalNumber)
        : additionalNumber,
      comment,
      notcall,
      delivery: deliveryFields,
    });

    return !!updatedOrder.affected;
  }

  public async updateStatusToPaid(orderId: number): Promise<boolean> {
    const updatedOrder = await this.ordersRepository.update(orderId, {
      status: Status.PAID,
    });

    if (!updatedOrder.affected) {
      throw new NotFoundException(`Замовлення з ID: ${orderId} не знайдено`);
    }
    return !!updatedOrder.affected;
  }

  public async updateStatusToCancelled(orderId: number): Promise<boolean> {
    const updatedOrder = await this.ordersRepository.update(orderId, {
      status: Status.CANCELLED,
    });
    if (!updatedOrder.affected) {
      throw new NotFoundException(`Замовлення з ID: ${orderId} не знайдено`);
    }
    return !!updatedOrder.affected;
  }

  public async updateStatus(
    orderId: number,
    updateStatusDto: UpdateStatusDto,
  ): Promise<boolean> {
    const statuses = Object.values(Status);
    const parameters = await this.parametersRepository.findOne({
      name: ParametersNameEnum.cashback,
    });
    const cashbackIsActive = parameters.settings['enable'];

    if (updateStatusDto.status === Status.COMPLETED && cashbackIsActive) {
      this.takeCashback(orderId, parameters);
    }

    if (!statuses.includes(updateStatusDto.status)) {
      throw new BadRequestException(`Статус не існує`);
    }

    const updatedOrder = await this.ordersRepository.update(
      orderId,
      updateStatusDto,
    );
    if (!updatedOrder.affected) {
      throw new NotFoundException(`Замовлення з ID: ${orderId} не знайдено`);
    }
    return !!updatedOrder.affected;
  }

  public async updatePaymentStatus(
    orderId: number,
    updatePaymentStatusDto: UpdatePaymentStatusDto,
  ): Promise<boolean> {
    const updatedOrder = await this.ordersRepository.update(
      orderId,
      updatePaymentStatusDto,
    );

    if (updatePaymentStatusDto.paymentStatus) {
      this.checkboxService.cashierSignIn(orderId);
    }

    if (!updatedOrder.affected) {
      throw new NotFoundException(`Замовлення з ID: ${orderId} не знайдено`);
    }
    return !!updatedOrder.affected;
  }

  public async updateColorSize(
    UpdateProductInOrderDto: UpdateProductInOrderDto,
  ): Promise<boolean> {
    const { value, field, productToOrderId, orderId } = UpdateProductInOrderDto;
    const setObj = field === 'color' ? { color: value } : { size: value };

    const result = await this.productToOrderRepository
      .createQueryBuilder()
      .update()
      .set(setObj)
      .where('orderId = :orderId', { orderId })
      .andWhere('id = :productToOrderId', { productToOrderId })
      .execute();

    if (result.affected) {
      return true;
    }

    return false;
  }

  public async clearCart(userId: number): Promise<boolean> {
    const productsInCart = await this.productToOrderRepository
      .createQueryBuilder('cartProducts')
      .leftJoinAndSelect('cartProducts.order', 'order')
      .where('order.status = :status', { status: Status.OPEN })
      .leftJoin('order.user', 'user')
      .andWhere('user.id = :id', { id: userId })
      .getMany();

    if (!productsInCart.length) {
      throw new NotFoundException();
    }

    const cartIds = productsInCart.map((item) => item.id);
    const orderIds = [...new Set(productsInCart.map((item) => item.order.id))];

    if (orderIds.length === 1) {
      await this.ordersRepository.update(orderIds[0], { amount: 0 });
    } else {
      throw new ForbiddenException(`Знайдено більше, ніж одне замовлення`);
    }

    const result = await this.productToOrderRepository.delete(cartIds);

    if (result) await this.ordersRepository.delete(orderIds[0]);

    return !!result.affected;
  }

  public async deleteFromCart(
    userId: number,
    productId: number,
  ): Promise<boolean> {
    const productInCart = await this.productToOrderRepository
      .createQueryBuilder('cartProduct')
      .leftJoinAndSelect('cartProduct.order', 'order')
      .where('order.status = :status', { status: Status.OPEN })
      .leftJoin('order.user', 'user')
      .andWhere('user.id = :userId', { userId })
      .leftJoin('cartProduct.product', 'product')
      .andWhere('product.id = :productId', { productId })
      .getOne();

    if (!productInCart) {
      throw new NotFoundException(
        `Продукт з ID: ${productId} не знайдено у кошику`,
      );
    }

    const amount = productInCart.order.amount - productInCart.amount;

    const res = await this.ordersRepository.update(
      { id: productInCart.order.id },
      { amount },
    );
    if (!res.affected) {
      throw new NotFoundException(
        `Замовлення з ID: ${productInCart.order.id} не знайдено`,
      );
    }

    const result = await this.productToOrderRepository.delete(productInCart.id);

    const productsInCart = await this.productToOrderRepository
      .createQueryBuilder('cartProduct')
      .leftJoinAndSelect('cartProduct.order', 'order')
      .where('order.status = :status', { status: Status.OPEN })
      .leftJoin('order.user', 'user')
      .andWhere('user.id = :userId', { userId })
      .getMany();

    if (productsInCart.length === 0)
      await this.ordersRepository.delete(productInCart.order.id);

    return !!result.affected;
  }

  public async deleteOrder(orderId: number): Promise<boolean> {
    const order = await this.ordersRepository.findOne(orderId);
    new CustomValidation().notFound('Замовлення', 'ID', orderId, order);

    const orderProducts = await this.productToOrderRepository.find({
      where: { order: order.id },
    });
    const orderProductIds = orderProducts.map((p) => p.id);
    orderProductIds.length &&
      (await this.productToOrderRepository.delete(orderProductIds));

    const result = await this.ordersRepository.delete(order.id);
    return !!result.affected;
  }

  public async getLastOrderWithoutAuth(): Promise<Order> {
    const lastOrder = await this.ordersRepository.findOne({
      order: { id: 'DESC' },
    });

    return lastOrder;
  }

  private async takeCashback(orderId, parameters) {
    const { user } = await this.getOrderById(orderId);
    const { amount } = await this.ordersRepository.findOne(orderId);
    const { percent } = parameters.settings['currentCashback'];

    let currentWallet = parseFloat(user.userWallet);

    this.userRepository.update(user.id, {
      userWallet: '' + (currentWallet + (amount * percent) / 100),
    });
  }
}
