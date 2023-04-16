import { PobedovParserService } from './pobedov/pobedov-parser.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ShopParserService } from './fashion-girl/shop-parser.service';
import { Product } from '../product/product.entity';
import { Category } from '../category/category.entity';
import { ShopParserController } from './shop-parser.controller';
import { Characteristic } from '../characteristics/characteristics.entity';
import { CharacteristicValue } from '../characteristics-values/characteristics-values.entity';
import { ProductModule } from '../product/product.module';
import { ProductService } from '../product/product.service';
import { ImageUtilsModule } from '../image/image-utils.module';
import { ImageUtilsService } from '../image/image-utils.service';
import { FilesService } from '../files/files.service';
import { FilesModule } from '../files/files.module';
import { CharacteristicsValuesModule } from '../characteristics-values/characteristics-values.module';
import { CharacteristicsValuesService } from '../characteristics-values/characteristics-values.service';
import { CategoryModule } from '../category/category.module';
import { CategoryService } from '../category/categories.service';
import { CharacteristicGroup } from '../characteristic-group/characteristic-group.entity';
import { ToolsModule } from '../tools/tools.module';
import { ToolsService } from '../tools/tools.service';
import { ColorsPicturesFiles } from '../colors-pictures/colors-pictures.entity';
import { ColorsPicturesService } from '../colors-pictures/colors-pictures.service';
import { User } from 'src/user/user.entity';
import { UserModule } from 'src/user/user.module';
import { ParsersHelperUtils } from './utils/parserHelper.utils';
import { ParserSettings } from './parserSettings.entity';
import { SocketModule } from 'src/socket/socket.module';
import { LetsShopParserService } from './letsShop/letsShop-parser.service';
import { MistakesFixer } from './letsShop/mistakesFixer';
import { WhiteMandarinParserService } from './white-mandarin/white-mandarin-parser.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ParserSettings,
      Category,
      User,
      Characteristic,
      CharacteristicValue,
      CharacteristicGroup,
      ColorsPicturesFiles,
    ]),
    ProductModule,
    ImageUtilsModule,
    FilesModule,
    CharacteristicsValuesModule,
    CategoryModule,
    ToolsModule,
    UserModule,
    SocketModule,
  ],
  exports: [ShopParserService],
  controllers: [ShopParserController],
  providers: [
    ShopParserService,
    PobedovParserService,
    LetsShopParserService,
    WhiteMandarinParserService,
    ProductService,
    ImageUtilsService,
    FilesService,
    CharacteristicsValuesService,
    CategoryService,
    ToolsService,
    ColorsPicturesService,
    ParsersHelperUtils,
    MistakesFixer,
  ],
})
export class ShopParserModule {}
