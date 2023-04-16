import {
  Body,
  Controller,
  Post,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger';

import { AuthDto, VerifyAccountDto } from './auth.dto';
import { AuthService } from './auth.service';
import { AuthResponse } from './auth';
import { ValidateUserRoleStrategy } from '../user/user.strategy';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { CreateGoogleUser } from 'src/user/dto/create-google-user.dto';
import { CreateFBUser } from 'src/user/dto/create-fb-user.dto';
import { UserRoleEnum } from '../user/user.enum';
import { AdminGuard } from './guards/admin.guard';
import { RoleService } from '../user/role/role.service';
import { CreateCutUserDto } from '../user/dto/create-cut-user.dto';
import { CutUserRegisterResponse } from './auth';
import { CreateUserThroughAdminDto } from 'src/user/dto/create-user-through-admin.dto';
import { IResponseMessage } from 'src/interfaces/response-message.interface';
import { ResendMessageDto } from './dto/resend-message.dto';
import { ForbiddenExceptionFilter } from 'src/utils/http-exception.filter';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import {AuthorizedGuard} from "./guards/authorized.guard";

@ApiTags('Auth')
@Controller('auth')
@UseInterceptors(LoggingInterceptor)
export class AuthController {
  constructor(
    private roleService: RoleService,
    private authService: AuthService,
  ) {}

  @Post('login')
  public async login(@Body() dto: AuthDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Post('register')
  public async register(@Body() dto: CreateUserDto): Promise<AuthResponse> {
    return this.authService.registerUser(dto);
  }

  @Post('resend-message')
  public async resendMessage(
    @Body() dto: ResendMessageDto,
  ): Promise<AuthResponse> {
    return this.authService.resendMessage(dto);
  }

  @Post('fast-register')
  public async fastRegister(
    @Body() dto: CreateCutUserDto,
  ): Promise<CutUserRegisterResponse> {
    return this.authService.registerCutUser(dto);
  }

  @Post('register-through-admin')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  @UseFilters(ForbiddenExceptionFilter)
  public async registerUserThroughAdmin(
    @Body() dto: CreateUserThroughAdminDto,
  ): Promise<IResponseMessage> {
    return this.authService.registerUserThroughAdmin(dto);
  }

  @Post('verify')
  public async verifyAccount(
    @Body() dto: VerifyAccountDto,
  ): Promise<AuthResponse> {
    return this.authService.verifyAccount(dto);
  }

  @Post('admin/login')
  public async loginAdmin(@Body() dto: AuthDto): Promise<AuthResponse> {
    const roles = await this.roleService.findByNames([
      UserRoleEnum.admin,
      UserRoleEnum.moderator,
    ]);

    return this.authService.login(dto, new ValidateUserRoleStrategy(roles));
  }

  @Post('google')
  public async loginGoogle(
    @Body()  body: CreateGoogleUser,
  ): Promise<AuthResponse> {
    return this.authService.googleLogIn(body);
  }

  @Post('facebook')
  public async loginFB(@Body() dto: CreateFBUser): Promise<AuthResponse> {
    return this.authService.fbLogin(dto);
  }
}
