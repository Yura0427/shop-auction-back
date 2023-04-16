import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { IDeleteMessage } from 'src/interfaces/delete-message.interface';
import { AuthorizedGuard } from '../auth/guards/authorized.guard';
import { UserService } from './user.service';
import { IFile } from 'src/interfaces/file.interface';
import { IResponseMessage } from 'src/interfaces/response-message.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilesService } from 'src/files/files.service';
import { IRequest } from './interfaces/request.interface';
import { User } from './user.entity';
import { ImageUtilsService } from '../image/image-utils.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SendChangeEmail, ChangeEmailDto } from './dto/change-email.dto';
import { AuthResponse } from '../auth/auth';
import { ContactUsInterface } from 'src/interfaces/contactUs.interface';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PaginationDto } from '@shared/pagination.dto';
import { PaginatedUsers, GetUserByEmail } from './dto/paginatedUsers.dto';
import { ResendPasswordDto } from './dto/resend-password.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { UserSessionCache } from '../utils/users-sessions/user-session-cache';
import {
  IDatePoint,
  IRegistredUsersByDate,
} from '../interfaces/registredUsersByDate.interface';
import { UserSession } from '../utils/users-sessions/user-session';
import { UsersDateRangeDto } from './dto/users-date-range.dto';
import { Source } from '../image/cropper.enum';
import { PreResetPasswordDto } from './dto/pre-reset-password.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Users')
@Controller('users')
@UseInterceptors(LoggingInterceptor)
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly filesService: FilesService,
    private readonly userSessionCache: UserSessionCache,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  async getAllUsers(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedUsers> {
    return this.userService.getAllUsers(paginationDto);
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  public async getProfile(@Request() req: IRequest): Promise<User> {
    return this.userService.getProfile(req.user.id);
  }

  @Get('statistic')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  public async getUsersStatistics(
    @Query() queryDataRange: UsersDateRangeDto,
  ): Promise<IRegistredUsersByDate> {
    const onlineUsers: UserSession[] | [] =
      (await this.userSessionCache.getAllActive()) || [];
    const registredUsers: IDatePoint[] = await this.userService.getRegistredUsersByDate(
      queryDataRange.dateRange,
    );
    return { registredUsers, onlineUsers: onlineUsers.length.toString() };
  }

  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  @Get('registred-users')
  async getRegistredUsers(): Promise<User[]> {
    return this.userService.getRegistredUsers();
  }

  // ??? this endpoint is not use now(maybe)
  // @Get(':id')
  // @ApiBearerAuth()
  // @UseGuards(AuthorizedGuard)
  // public async findOne(
  //   @Request() req: IRequest,
  //   @Param('id') id: number,
  // ): Promise<User> {
  //   return this.userService.findUser(req.user, id);
  // }

  @Get('/avatar/:imgName')
  async getImage(
    @Param('imgName') imgName: string,
    @Res() res: Response,
  ): Promise<void> {
    return this.filesService.getImage(imgName, res);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  public update(
    @Request() req: IRequest,
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.updateUser(req.user, id, updateUserDto);
  }

  @Delete('avatar')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  async deleteAvatar(@Request() req: IRequest): Promise<IDeleteMessage> {
    return this.filesService.deleteImage(req.user.avatar.name);
  }

  @Post(':id')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  public delete(
    @Request() req: IRequest,
    @Param('id') id: number,
    @Body() body: PaginationDto,
  ): Promise<IDeleteMessage> {
    return this.userService.removeUser(req.user, id, body);
  }

  @Post('avatar/add')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: String })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: process.env.IMG_TEMP,
        filename: ImageUtilsService.customImageFileName,
      }),
      fileFilter: ImageUtilsService.imageFileFilter,
      limits: {
        fileSize: 10000000,
      },
    }),
  )
  @UsePipes(ValidationPipe)
  async uploadUserPhoto(
    @UploadedFile() image: IFile,
    @Request() req: IRequest,
  ): Promise<IResponseMessage> {
    return this.userService.uploadImage(
      req.user.id,
      image,
      Source.avatar,
      req.user?.avatar?.name,
    );
  }

  @Patch('password')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  async changePassword(
    @Body() body: ChangePasswordDto,
    @Request() req: IRequest,
  ): Promise<User> {
    return this.userService.changePassword(req.user.id, body);
  }

  @Patch('update')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard, AdminGuard)
  async updateUser(@Body() body: UpdateUserProfileDto): Promise<User> {
    return this.userService.updateProfileUser(body);
  }

  @Post('email/change')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  async sendChangeEmail(
    @Body() body: SendChangeEmail,
    @Request() req: IRequest,
  ): Promise<IResponseMessage> {
    return this.userService.sendChangeEmail(body);
  }

  @Post('newEmail/set')
  @ApiBearerAuth()
  @UseGuards(AuthorizedGuard)
  async changeEmail(@Body() body: ChangeEmailDto): Promise<AuthResponse> {
    return this.userService.changeEmail(body);
  }

  // ??? this endpoint is not use now(maybe)
  // @Get('search/:email')
  // async getSearchUsersByEmail(
  //   @Param('email') email: string,
  //   @Query() paginationDto: PaginationDto,
  // ): Promise<GetUserByEmail> {
  //   return this.userService.getSearchUsersByEmail(email, paginationDto);
  // }

  @Post('feedbackUser')
  @UseGuards(AuthorizedGuard)
  async sendContactUs(
    @Body() body: ContactUsInterface,
  ): Promise<IResponseMessage> {
    return this.userService.sendEmailFromUser(body);
  }

  @Post('password/reset')
  async resetPassword(
    @Body() dto: ResendPasswordDto,
  ): Promise<IResponseMessage> {
    return this.userService.resetPassword(dto);
  }

  @Post('password/preinstall')
  async preInstallPassword(
    @Body() body: PreResetPasswordDto,
  ): Promise<IResponseMessage> {
    return this.userService.preInstallPassword(body);
  }

  @Post('password/install')
  async installPassword(@Body() body: ResetPasswordDto): Promise<any> {
    return this.userService.installPassword(body);
  }
}
