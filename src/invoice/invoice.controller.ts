import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthorizedGuard } from '../auth/guards/authorized.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { InvoiceService } from './invoice.service';
import { Response } from 'express';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { InvoiceDateRangeDto } from './dto/invoice-date-range.dto';

@ApiTags('Invoice')
@Controller('invoice')
@UseInterceptors(LoggingInterceptor)
@ApiBearerAuth()
@UseGuards(AuthorizedGuard, AdminGuard)
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Post()
  async generateAndSaveInvoice(@Body() dto: InvoiceDateRangeDto) {
    const invoice = await this.invoiceService.generateXlsxFile(
      dto.startDate,
      dto.endDate,
    );
    this.invoiceService.saveXlsxFile(invoice);
  }

  @Get('all')
  async getInvoicesList() {
    return await this.invoiceService.getInvoicesList();
  }

  @Get(':invoiceName')
  async getInvoice(
    @Param('invoiceName') invoiceName: string,
    @Res() res: Response,
  ) {
    if (process.env.NODE_ENV !== 'local') {
      const buffer: Buffer = await this.invoiceService.getInvoiceFromStorage(
        invoiceName,
      );
      res.end(buffer);
    } else {
      this.invoiceService.getInvoice(invoiceName, res);
    }
  }

  @Delete(':invoiceName')
  async deleteInvoice(@Param('invoiceName') invoiceName: string) {
    if (process.env.NODE_ENV !== 'local') {
      await this.invoiceService.deleteInvoiceFromStorage(invoiceName);
    } else {
      await this.invoiceService.deleteInvoice(invoiceName);
    }
  }
}
