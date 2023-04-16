import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { CallbackDto } from './dto/callback.dto';
import { P2PPaymentDto } from './dto/p2p-payment.dto';
import { LiqpayService } from './liqpay.service';

@ApiTags('Liqpay')
@Controller('liqpay')
@UseInterceptors(LoggingInterceptor)
export class LiqpayController {
  constructor(private readonly liqpayService: LiqpayService) {}

  @Post('payment/:orderId')
  async checkPaymentStatus(
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<any> {
    return this.liqpayService.getPaymentStatusAndSaveInfo(orderId);
  }

  @Post('p2p')
  p2pPayment(@Body() dto: P2PPaymentDto): void {
    return this.liqpayService.p2pPayment(dto);
  }

  @Post('callback')
  callbak(@Body() dto: CallbackDto): Promise<void> {
    return this.liqpayService.callback(dto);
  }
}
