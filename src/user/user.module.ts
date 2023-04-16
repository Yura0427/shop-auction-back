import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './role/role.entity';
import { File } from 'src/files/files.entity';
import { FilesService } from 'src/files/files.service';
import { ConfirmationToken } from 'src/user/confirmation-token.entity';
import { UsersController } from './user.controller';
import { User } from './user.entity';
import { UserService } from './user.service';
import { ImageUtilsModule } from '../image/image-utils.module';
import { MailService } from 'src/mail/mail.service';
import { JwtModule } from '@nestjs/jwt';
import { Delivery } from '../delivery/delivery.entity';
import { Order } from 'src/orders/orders.entity';
import { jwtConfig } from '../configs/jwt/jwt-module-config';
import { UserSessionCache } from '../utils/users-sessions/user-session-cache';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      File,
      Role,
      ConfirmationToken,
      Delivery,
      Order,
    ]),
    ImageUtilsModule,
    JwtModule.register(jwtConfig),
    CacheModule.register({
      isGlobal: true,
    }),
  ],
  exports: [TypeOrmModule, JwtModule],
  controllers: [UsersController],
  providers: [UserService, FilesService, MailService, UserSessionCache],
})
export class UserModule {}
