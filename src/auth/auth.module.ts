import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UserService } from 'src/user/user.service';
import { RoleModule } from '../user/role/role.module';
import { MailModule } from 'src/mail/mail.module';
import { GoogleService } from './google/google.service';
import { ImageUtilsModule } from '../image/image-utils.module';
import { jwtConfig } from '../configs/jwt/jwt-module-config';

@Module({
  imports: [
    UserModule,
    MailModule,
    PassportModule,
    JwtModule.register(jwtConfig),
    RoleModule,
    ImageUtilsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    UserService,
    GoogleService,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
