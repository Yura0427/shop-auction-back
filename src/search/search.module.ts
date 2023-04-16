import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { CategoryModule } from 'src/category/category.module';
import { ProductModule } from 'src/product/product.module';
import { jwtConfig } from '../configs/jwt/jwt-module-config';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [SearchController],
  providers: [SearchService],
  imports: [
    CategoryModule,
    ProductModule,
    UserModule,
    JwtModule.register(jwtConfig),
  ],
})
export class SearchModule {}
