import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/orders/orders.entity';
import { Status } from 'src/orders/orderStatus.enum';
import { Repository } from 'typeorm';
import { Workbook } from 'exceljs';
import * as nodeCron from 'node-cron';
import * as path from 'path';
import * as fs from 'fs';
import { DownloadResponse, Storage } from '@google-cloud/storage';
import { Response } from 'express';
import { Invoice } from './invoice.entity';
import { File } from 'src/files/files.entity';
import { IInvoiceDateRange } from 'src/interfaces/invoice';
import * as moment from 'moment-timezone';

@Injectable()
export class InvoiceService {
  private cronJob: nodeCron.ScheduledTask;
  private rootPathArray: string[];
  private invoiceDir: string;
  private googleStorage: Storage;
  private bucket: any;

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(File)
    private filesRepository: Repository<File>,
  ) {
    this.rootPathArray = __dirname.split(path.sep);

    this.invoiceDir =
      (() => {
        for (let i = 0; i < 4; i++) {
          this.rootPathArray.pop();
        }
        return [...this.rootPathArray];
      })().join(path.sep) +
      path.sep +
      'uploads' +
      path.sep +
      'invoices';

    this.cronJob = nodeCron.schedule('0 0 1 * *', () =>
      this.generateXlsxFile(),
    );

    if (!fs.existsSync(this.invoiceDir)) {
      fs.mkdirSync(this.invoiceDir, { recursive: true });
    }

    this.googleStorage = new Storage({
      keyFilename: path.join(__dirname, '../../../storage-key.json'),
      projectId: process.env.GOOGLE_BUCKET_PROJECT,
    });

    this.bucket = this.googleStorage.bucket(process.env.GOOGLE_BUCKET);

    this.cronJob.start();
  }

  private async getOrdersByDateRange(
    invoiceDateRange: IInvoiceDateRange,
  ): Promise<Order[]> {
    const startDate = invoiceDateRange.startDate;
    const endDate = invoiceDateRange.endDate;
    return await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.createdAt > :startDate', { startDate })
      .andWhere('order.createdAt < :endDate', { endDate })
      .andWhere('order.status = :status', { status: Status.COMPLETED })
      .innerJoinAndSelect('order.user', 'user')
      .select([
        'order.amount',
        'order.additionalFirstName',
        'order.additionalLastName',
        'order.additionalEmail',
        'order.additionalNumber',
        'user.firstName',
        'user.lastName',
        'user.phoneNumber',
        'user.email',
      ])
      .getMany();
  }

  private formDataForTable(data: any): any[] {
    const newData = [];
    let row = [];
    let counter = 1;
    data.forEach((d: any) => {
      const formatedRow = {
        number: counter,
        firstName: d.additionalFirstName
          ? d.additionalFirstName
          : d.user.firstName,
        lastName: d.additionalLastName ? d.additionalLastName : d.user.lastName,
        email: d.additionalEmail ? d.additionalEmail : d.user.email,
        phoneNumber: d.additionalNumber
          ? d.additionalNumber
          : d.user.phoneNumber,
        amount: d.amount,
      };
      const keys = Object.keys(formatedRow);
      counter++;
      keys.forEach((key) => {
        row.push(formatedRow[key]);
      });
      newData.push(row);
      row = [];
    });
    return newData;
  }

  public async generateXlsxFile(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Workbook> {
    const title = 'Інвойс';
    const header = ['№', `Ім'я`, 'Прізвище', 'Email', 'Номер телефону', 'Ціна'];

    const dataFromDB = await this.getOrdersByDateRange({ startDate, endDate });

    const data = this.formDataForTable(dataFromDB);
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Invoice');

    const titleRow = worksheet.addRow([title]);
    titleRow.font = {
      size: 24,
      underline: 'double',
      bold: true,
    };

    worksheet.addRow([]);

    worksheet.addRow([
      'Дата : ' +
        moment().locale('uk').tz('Europe/Kyiv').format('LLL:ss') +
        '.' +
        ' Сформовано за період з ' +
        moment(startDate).locale('uk').format('LL') +
        ' по ' +
        moment(endDate).locale('uk').format('LL') +
        '.',
    ]);

    worksheet.addRow([]);

    const headerRow = worksheet.addRow(header);

    headerRow.font = {
      bold: true,
    };

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' },
        bgColor: { argb: 'FF0000FF' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    let sum = 0;
    data.forEach((d) => {
      worksheet.addRow(d);
      sum += d[5];
    });

    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(4).width = 30;
    worksheet.getColumn(5).width = 30;

    const resultRow = worksheet.addRow(['', '', '', '', 'Разом:', sum]);

    resultRow.getCell(5).font = {
      bold: true,
    };
    resultRow.getCell(6).font = {
      bold: true,
    };

    resultRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
      };
    });

    worksheet.addRow([]);

    const footerRow = worksheet.addRow([
      'Це згенерований системою ексель лист.',
    ]);

    footerRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCFFE5' },
    };

    footerRow.getCell(1).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    worksheet.mergeCells(`A${footerRow.number}:F${footerRow.number}`);

    return workbook;
  }

  public async saveXlsxFile(workbook: Workbook): Promise<void> {
    const buffer = await workbook.xlsx.writeBuffer();
    const fileSizeInKB = Math.round(buffer.byteLength / 1024);
    const invoiceFileName = moment()
      .tz('Europe/Kyiv')
      .format('[Invoice-]DD-MM-YY-hh-mm-ss[.xlsx]');

    if (process.env.NODE_ENV !== 'local') {
      const filePath = `${process.env.INVOICE_PATH_STORAGE}/${invoiceFileName}`;

      const file = this.bucket.file(filePath);

      await file.save(buffer, {
        metadata: {
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
    } else {
      workbook.xlsx.writeFile(
        process.env.INVOICE_PATH_LOCAL + path.sep + invoiceFileName,
      );
    }

    const invoiceFile = await this.filesRepository.save({
      name: invoiceFileName,
    });

    await this.invoicesRepository.save({
      fileSize: fileSizeInKB,
      invoiceFile,
      createdAt: moment().tz('Europe/Kyiv').toDate(),
    });

    Logger.log('Saved new xlsx file.');
  }

  public async getInvoice(invoiceName: string, res: Response): Promise<void> {
    try {
      await fs.promises.access(
        process.env.INVOICE_PATH_LOCAL + path.sep + invoiceName,
      );
      return res.sendFile(invoiceName, {
        root: process.env.INVOICE_PATH_LOCAL,
      });
    } catch (error) {
      throw new NotFoundException(`Інвойс з назвою ${invoiceName} не знайдено`);
    }
  }

  public async deleteInvoice(invoiceName: string): Promise<void> {
    await fs.unlink(
      process.env.INVOICE_PATH_LOCAL + path.sep + invoiceName,
      (err) => {
        if (err) {
          console.log(err);
        }
      },
    );
    const invoiceFileToDelete = await this.filesRepository.findOne({
      name: invoiceName,
    });

    if (invoiceFileToDelete) {
      this.invoicesRepository.delete({ invoiceFile: invoiceFileToDelete });
      this.filesRepository.delete({ id: invoiceFileToDelete.id });
    }
  }

  public async getInvoicesList(): Promise<Invoice[]> {
    const allInvoices = await this.invoicesRepository.find({
      relations: ['invoiceFile'],
    });
    return allInvoices;
  }

  public async getInvoiceFromStorage(fileName: string) {
    const filePath = `${process.env.INVOICE_PATH_STORAGE}/${fileName}`;

    const fileResponse: DownloadResponse = await this.bucket
      .file(filePath)
      .download();
    const [buffer] = fileResponse;
    return buffer;
  }

  async deleteInvoiceFromStorage(fileName: string) {
    const filePath = `${process.env.INVOICE_PATH_STORAGE}/${fileName}`;

    await this.bucket.file(filePath).delete({ ignoreNotFound: true });

    const invoiceFileToDelete = await this.filesRepository.findOne({
      name: fileName,
    });

    if (invoiceFileToDelete) {
      this.invoicesRepository.delete({ invoiceFile: invoiceFileToDelete });
      this.filesRepository.delete({ id: invoiceFileToDelete.id });
    }
  }
}
