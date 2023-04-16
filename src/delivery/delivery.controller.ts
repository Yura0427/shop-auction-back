import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthorizedGuard } from '../auth/guards/authorized.guard';
import { DeliveryService } from './delivery.service';
import { Delivery } from './delivery.entity';
import { IRequest } from '../user/interfaces/request.interface';
import { DeliveryDto } from './dto/delivery.dto';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';

@ApiTags('Delivery')
@Controller('delivery')
@UseInterceptors(LoggingInterceptor)
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  async createDelivery(
    @Request() req: IRequest,
    @Body() body: DeliveryDto,
  ): Promise<Delivery> {
    return this.deliveryService.createDelivery(req.user.id, body);
  }
}
