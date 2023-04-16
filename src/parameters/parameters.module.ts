import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { ParametersController } from './parameters.controller';
import { Parameters } from './parameters.entity';
import { ParametersService } from './parameters.service';
import { jwtConfig } from '../configs/jwt/jwt-module-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Parameters]),
    JwtModule.register(jwtConfig),
  ],
  providers: [ParametersService],
  controllers: [ParametersController],
  exports: [ParametersService],
})
export class ParametersModule {}
