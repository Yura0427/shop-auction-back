import { Module } from '@nestjs/common';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/product.entity';
import { Category } from '../category/category.entity';
import { User } from 'src/user/user.entity';

@Module({
  controllers: [ToolsController],
  providers: [ToolsService],
  imports: [TypeOrmModule.forFeature([Product, Category, User])],
  exports: [ToolsService],
})
export class ToolsModule {}
