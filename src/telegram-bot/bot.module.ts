import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BotService } from './bot.service';
import { User } from 'src/user/user.entity';
import { Role } from '../user/role/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [BotService],
  controllers: [],
  exports: [BotService],
})
export class BotModule {}
