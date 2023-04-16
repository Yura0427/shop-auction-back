import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParserSettings } from 'src/shop-parser/parserSettings.entity';
import { ChatGateway } from './socket-console.gateway';
import { Product } from 'src/product/product.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
          ParserSettings,
          Product,
        ])
    ],
    providers: [ ChatGateway ],
    exports: [ ChatGateway ],
  })
export class SocketModule {}


  export class ShopParserModule {}