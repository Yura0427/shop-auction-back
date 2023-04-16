import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { PaginationDto } from '@shared/pagination.dto';
import { paginationBySearchDTO } from './dto/pagination-by-serch.dto';
import { IResponseMessage } from 'src/interfaces/response-message.interface';
import { UpdateOrderDto } from 'src/orders/dto/update-order.dto';
import { UpdateOrderAdminDto } from 'src/orders/dto/update-order-admin.dto';
import { ProductToOrder } from 'src/product-to-order/product-to-order.entity';
import { IRequest } from 'src/user/interfaces/request.interface';
import { AuthorizedGuard } from '../auth/guards/authorized.guard';
import { PaginatedOrdersDto } from './dto/paginated-orders.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Order } from './orders.entity';
import { OrdersService } from './orders.service';
import { AddOrderDto } from './dto/add-order.dto';
import { ToPendingDto } from './dto/toPending.dto';
import { UpdateProductInOrderDto } from './dto/update-product-in-order.dto';
import { ForbiddenExceptionFilter } from 'src/utils/http-exception.filter';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { OrdersDateRangeDto } from './dto/orders-date-range.dto';
import { IOrdersByDateRange } from '../interfaces/ordersByDateRange.interface';
import { UpdatePaymentStatusDto } from './dto/updatePaymentStatus.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Orders')
@Controller('orders')
@UseInterceptors(LoggingInterceptor)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  async getAllOrders(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedOrdersDto> {
    return this.ordersService.getOrders(paginationDto);
  }

  @Get('params')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  async getAllOrdersByParams(
    @Query() paginationBySearchDTO: paginationBySearchDTO,
  ): Promise<any> {
    return await this.ordersService.getOrdersBySearchParams(
      paginationBySearchDTO,
    );
  }

  @Get('statistic')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  async getOrdersByDateRange(
    @Query() queryDataRange: OrdersDateRangeDto,
  ): Promise<IOrdersByDateRange[] | IResponseMessage> {
    return this.ordersService.getOrdersByDate(queryDataRange.dateRange, [
      'IS null',
      'IS NOT null',
    ]);
  }
  @Get('status')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  async getOrdersStatusByDateRange(
      @Query() queryDataRange: OrdersDateRangeDto,
  ): Promise<IOrdersByDateRange[] | IResponseMessage> {
    return this.ordersService.getOrdersStatusByDate(queryDataRange.dateRange, [
      'IS null',
      'IS NOT null',
    ]);
  }

  @Get('cart')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  async getOwnOrders(@Request() req: IRequest): Promise<Order | null> {
    return this.ordersService.getUserCart(req.user.id);
  }

  @Get('user/:userId')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  async getUserOrders(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedOrdersDto> {
    return this.ordersService.getUserOrders(userId, paginationDto);
  }

  @Get('/:id')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  async getOrderById(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.ordersService.getOrderById(id);
  }

  @Get('get/:id')
  @UseGuards(AuthorizedGuard)
  async getOrderByIdWithoutAuth(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Order> {
    return this.ordersService.getOrderByIdWithoutAuth(id);
  }

  // this endpoint is not use now
  // @Get('order/last')
  // async getLastOrderWithoutAuth(): Promise<Order> {
  //   return this.ordersService.getLastOrderWithoutAuth();
  // }

  @Post('/cart')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  async addOrder(@Request() req: IRequest, @Body() addOrderDto: AddOrderDto) {
    return this.ordersService.addOrder(addOrderDto, req.user.id);
  }

  @Put('cart/:productId')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  public updateCart(
    @Request() req: IRequest,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<ProductToOrder> {
    return this.ordersService.updateCart(
      req.user.id,
      productId,
      updateOrderDto,
    );
  }

  @Put(':orderId/:productId')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  public updateOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() updateOrderAdminDto: UpdateOrderAdminDto,
  ): Promise<ProductToOrder> {
    return this.ordersService.updateOrder(
      orderId,
      productId,
      updateOrderAdminDto,
    );
  }

  @Patch('status/pending')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  async updateStatusToPending(
    @Request() req: IRequest,
    @Body() delivery: ToPendingDto,
  ): Promise<IResponseMessage> {
    const result = await this.ordersService.updateStatusToPending(
      req.user.id,
      delivery,
    );
    if (result) {
      return { message: `Статус замовлення було змінено на 'В обробці'` };
    }
    return new NotFoundException(`Замовлення не знайдено`);
  }

  @Patch('status/paid/:orderId')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async updateStatusToPaid(
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<IResponseMessage> {
    const result = await this.ordersService.updateStatusToPaid(orderId);
    if (result) {
      return {
        message: `Статус замовлення ${orderId} було змінено на 'Оплачено'`,
      };
    }
    return new NotFoundException(`Замовлення з ID: ${orderId} не знайдено`);
  }

  @Patch('status/cancelled/:orderId')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  async updateStatusToCancelled(
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<IResponseMessage> {
    const result = await this.ordersService.updateStatusToCancelled(orderId);
    if (result) {
      return {
        message: `Статус замовлення ${orderId} було змінено на 'Скасовано'`,
      };
    }
    return new NotFoundException(`Замовлення з ID: ${orderId} не знайдено`);
  }

  @Patch('status/:orderId')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async updateStatus(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() updateStatusDto: UpdateStatusDto,
  ): Promise<IResponseMessage> {
    const result = await this.ordersService.updateStatus(
      orderId,
      updateStatusDto,
    );
    if (result) {
      return {
        message: `Статус замовлення ${orderId} було змінено`,
      };
    }
    return new NotFoundException(`Замовлення з ID: ${orderId} не знайдено`);
  }

  @Patch('payment-status/:orderId')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async updatePaymentStatus(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
  ): Promise<IResponseMessage> {
    const result = await this.ordersService.updatePaymentStatus(
      orderId,
      updatePaymentStatusDto,
    );
    if (result) {
      return {
        message: `Статус замовлення ${orderId} було змінено`,
      };
    }
    return new NotFoundException(`Замовлення з ID: ${orderId} не знайдено`);
  }

  @Put('product/')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async updateProductInOrderc(
    @Body() UpdateProductInOrderDto: UpdateProductInOrderDto,
  ): Promise<IResponseMessage | Order> {
    const result = await this.ordersService.updateColorSize(
      UpdateProductInOrderDto,
    );

    if (result) {
      return await this.ordersService.getOrderById(
        UpdateProductInOrderDto.orderId,
      );
    }

    return new NotFoundException('Виникли проблеми при оновленні данних');
  }

  @Delete('clear-cart')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  async clearCart(@Request() req: IRequest): Promise<IResponseMessage> {
    const deleteResult = await this.ordersService.clearCart(req.user.id);

    if (deleteResult) {
      return { message: `Продукти були успішно видалені з кошику` };
    }
    return new NotFoundException();
  }

  @Delete('cart/:productId')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  async deleteFromCart(
    @Request() req: IRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ): Promise<IResponseMessage> {
    const deleteResult = await this.ordersService.deleteFromCart(
      req.user.id,
      productId,
    );
    if (deleteResult) {
      return { message: `Продукт з ID: ${productId} було видалено з кошика` };
    }
    return new NotFoundException(`Продукт з ID: ${productId} не знайдено`);
  }

  @Delete(':orderId')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  async deleteOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<IResponseMessage> {
    const deleteResult = await this.ordersService.deleteOrder(orderId);
    if (deleteResult) {
      return { message: `Замовлення з ID: ${orderId} було видалено` };
    }
    return new NotFoundException(`Замовлення з ID: ${orderId} не знайдено`);
  }
}
