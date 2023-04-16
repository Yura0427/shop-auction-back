import { PobedovParserService } from './pobedov/pobedov-parser.service';
import {
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { ShopParserService } from './fashion-girl/shop-parser.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as cron from 'node-cron';
import * as BlueBird from 'bluebird';
import { ToolsService } from '../tools/tools.service';
import { ParsersHelperUtils } from './utils/parserHelper.utils';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { ParserDto } from './parser.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthorizedGuard } from '../auth/guards/authorized.guard';
import { LetsShopParserService } from './letsShop/letsShop-parser.service';
import { WhiteMandarinParserService } from './white-mandarin/white-mandarin-parser.service';

@ApiTags('Parser')
@Controller('shop-parser')
@UseInterceptors(LoggingInterceptor)
@ApiBearerAuth()
@UseGuards(AuthorizedGuard, AdminGuard)
export class ShopParserController implements OnModuleInit {
  async onModuleInit() {
    // const feedGenerator = cron.schedule(
    //   '00 00 01 * * *',
    //   () => this.toolsService.generateFeed(),
    //   {
    //     timezone: 'Europe/Kiev',
    //     scheduled: false,
    //   },
    // );
    // feedGenerator.start();

    const arr = new Array(3);

    const parserMap = {
      // 1: this.toolsService.generateSitemap.bind(this.toolsService),
      // 2: this.pobedovParser.beginParsing.bind(this.pobedovParser),
      // 3: this.whiteMandarinParser.beginParsing.bind(this.whiteMandarinParser),
      1: this.letsShopParser.beginParsing.bind(this.letsShopParser),
      2: this.parserService.fashionGirlParcer.bind(this.parserService),
      3: this.toolsService.generateFeed.bind(this.toolsService),
    };

    const parsingTask = cron.schedule(
      '00 30 05 * * *',
      async () => {
        await BlueBird.mapSeries(arr, (promise, index) => {
          const i = index + 1;
          return parserMap[i]().catch(console.error);
        });
      },
      {
        timezone: 'Europe/Kiev',
        scheduled: false,
      },
    );

    if (process.env.IS_CRON_ENABLED === 'true') {
      parsingTask.start();
    }
  }

  constructor(
    private parserService: ShopParserService,
    private pobedovParser: PobedovParserService,
    private letsShopParser: LetsShopParserService,
    private whiteMandarinParser: WhiteMandarinParserService,
    private toolsService: ToolsService,
    @Inject('ParsersHelperUtils')
    private parsersHelperUtils: ParsersHelperUtils,
  ) {}

  @Get('/fashionGirl')
  async fashionGirlParser(@Query() parserDto: ParserDto): Promise<any> {
    try {
      return await this.parserService.fashionGirlParcer(
        parserDto.update,
        parserDto.key,
      );
    } catch (e) {
      console.log(e);
    }
  }

  @Get('/pobedov')
  async pobedov(@Query() parserDto: ParserDto): Promise<any> {
    try {
      return await this.pobedovParser.beginParsing(
        parserDto.update,
        parserDto.key,
      );
    } catch (e) {
      console.log(e);
    }
  }

  @Get('/letsShop')
  async letsShop(@Query() parserDto: ParserDto): Promise<any> {
    try {
      return await this.letsShopParser.beginParsing(
        parserDto.update,
        parserDto.key,
      );
    } catch (e) {
      console.log(e);
    }
  }

  @Get('/whiteMandarin')
  async whiteMandarin(@Query() parserDto: ParserDto): Promise<any> {
    return this.whiteMandarinParser.beginParsing(parserDto);
  }

  @Get('/whiteMandarin-stop')
  async whiteMandarinStop(): Promise<any> {
    return this.whiteMandarinParser.stopParsing();
  }

  @Delete('/whiteMandarin-delete')
  async whiteMandarinDelete(): Promise<any> {
    return this.whiteMandarinParser.deleteAllProducts();
  }

  @Get('/feed')
  async generateFeed(): Promise<any> {
    await this.toolsService.generateFeed();
  }

  @Get('/disablecategories')
  async disablecategories() {
    await this.parsersHelperUtils.disableEmptyCategories();
  }

  @Get('/redisablecategories')
  async redisablecategories() {
    await this.parsersHelperUtils.redisableCategoriesWithProducts();
  }

  @Get('/status')
  async getStatuses() {
    return await this.parsersHelperUtils.getStatus();
  }

  @Delete('/:shopKey')
  async parserCleaner(
    @Param('shopKey') shopKey: string,
    @Query('parserKey') parserKey: string,
  ): Promise<any> {
    return this.parsersHelperUtils.parserCleaner(shopKey, parserKey);
  }
}
