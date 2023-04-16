import { compare, hashSync } from 'bcrypt';
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import removeSpacesAndPlus from './../utils/removeSpacesAndPlus';
import { Role } from './role/role.entity';
import { File } from 'src/files/files.entity';
import { IFile } from 'src/interfaces/file.interface';
import { IResponseMessage } from 'src/interfaces/response-message.interface';
import { IDeleteMessage } from 'src/interfaces/delete-message.interface';
import { User } from './user.entity';
import { CustomValidation } from 'src/utils/custom-validation';
import { CreateBaseUserDto } from './dto/create-base-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ImageUtilsService } from '../image/image-utils.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SendChangeEmail, ChangeEmailDto } from './dto/change-email.dto';
import { ConfirmationToken } from './confirmation-token.entity';
import { AuthResponse } from '../auth/auth';
import { JwtService } from '@nestjs/jwt';
import { ContactUsInterface } from '../interfaces/contactUs.interface';
import { MailService } from 'src/mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateCutUserDto } from './dto/create-cut-user.dto';
import { PaginationDto } from '@shared/pagination.dto';
import { getTotalPages, takeSkipCalculator } from '../utils/get-total-pages';
import { PaginatedUsers, GetUserByEmail } from './dto/paginatedUsers.dto';
import { ResendPasswordDto } from './dto/resend-password.dto';
import { Order } from 'src/orders/orders.entity';
import addSpacesAndPlus from 'src/utils/addSpacesAndPlus';
import { IDatePoint } from 'src/interfaces/registredUsersByDate.interface';
import { Source } from '../image/cropper.enum';
import { PreResetPasswordDto } from './dto/pre-reset-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private imageUtilsService: ImageUtilsService,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(ConfirmationToken)
    private tokenRepository: Repository<ConfirmationToken>,
    private mailService: MailService,
    private readonly jwtService: JwtService,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  async getAllUsers(paginationDto: PaginationDto): Promise<PaginatedUsers> {
    const {
      page = 1,
      limit = 10,
      sort = 'id',
      sortDirect = 'asc',
    } = paginationDto;

    const { skip, take } = takeSkipCalculator(limit, page);

    const [data, count]: [
      User[],
      number,
    ] = await this.userRepository.findAndCount({
      relations: ['role'],
      take,
      skip,
      order: {
        [sort]: sortDirect.toUpperCase(),
      },
    });

    const totalPages = getTotalPages(count, limit, page);

    return { data, count, totalPages, currentPage: page };
  }

  async getRegistredUsers(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.firstName', 'user.lastName', 'user.winnerDate'])
      .where({ status: 'confirmed', role: 3, winnerDate: Not(IsNull()) })
      .orderBy('user.winnerDate', 'DESC')
      .limit(10)
      .getMany();
  }

  async getRegistredUsersByDate(range: string[]): Promise<IDatePoint[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .select([
        "to_char(user.createdAt, 'YYYY-MM-DD') AS date",
        'count(user.createdAt) as creatad',
      ])
      .where('user.createdAt between :dateStart and :dateStop', {
        dateStart: range[0],
        dateStop: range[1],
      })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    if (!users.length)
      throw new HttpException(
        'Дані за обраний період відсутні',
        HttpStatus.NOT_FOUND,
      );

    return users;
  }

  async getProfile(userId: number): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.createdAt',
        'user.updatedAt',
        'user.firstName',
        'user.lastName',
        'user.phoneNumber',
        'user.email',
        'user.telegramId',
        'user.dateOfBirth',
        'user.googleId',
        'user.facebookId',
        'user.role',
        'user.wafCoins',
        'user.winnerDate',
        'user.userWallet',
        'user.password',
      ])
      .where({ id: userId })
      .leftJoin('user.avatar', 'avatar')
      .addSelect('avatar.name')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoin('user.delivery', 'delivery')
      .addSelect([
        'delivery.areaName',
        'delivery.cityName',
        'delivery.cityFullName',
        'delivery.cityRef',
        'delivery.streetName',
        'delivery.streetRef',
      ])
      .getOne();
    const phoneNumber = addSpacesAndPlus(user.phoneNumber);
    const updatedUser = { ...user, hasPassword: true };
    if (!updatedUser.password) {
      updatedUser.hasPassword = false;
    } else {
      delete updatedUser.password;
    }

    return { ...updatedUser, phoneNumber };
  }

  async createUser(body: CreateBaseUserDto): Promise<User> {
    body.password = hashSync(body.password, JSON.parse(process.env.SALT));
    body.confirmPassword = hashSync(
      body.confirmPassword,
      JSON.parse(process.env.SALT),
    );
    return this.userRepository.save(body);
  }

  async createCutUser(body: CreateCutUserDto): Promise<User> {
    const role = await this.roleRepository.findOne({ name: 'user' });
    return this.userRepository.save({ ...body, role });
  }

  async findUser(currentUser: User, id: number): Promise<User> {
    const user = await this.userRepository.findOne(id, { relations: ['role'] });
    new CustomValidation().notFound('Користувача', 'ID', id, user);

    const theCurrentUser = currentUser.id === id;
    new CustomValidation().noAccess(theCurrentUser);

    return user;
  }

  async updateUser(
    currentUser: User,
    id: number,
    body: UpdateUserDto,
  ): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select()
      .where({ id: id })
      .leftJoin('user.avatar', 'avatar')
      .addSelect('avatar.name')
      .leftJoin('user.role', 'role')
      .addSelect('role.id')
      .getOne();

    new CustomValidation().notFound('Користувача', 'ID', id, user);
    const theCurrentUser = currentUser.id === id;
    const userAvatar = user.avatar;
    delete user.avatar;

    if (currentUser.role.name !== 'admin') {
      new CustomValidation().noAccess(theCurrentUser, user.role.name);
    }

    const {
      roleId,
      currentPassword,
      confirmNewPassword,
      newPassword,
      ...updatedUserField
    } = body;

    const userRole = roleId
      ? await this.roleRepository.findOne({ id: roleId })
      : user.role;

    if (newPassword && confirmNewPassword && currentPassword) {
      new CustomValidation().noAccess(theCurrentUser);
      await this.changePassword(id, {
        newPassword,
        confirmNewPassword,
        currentPassword,
      });
    }

    const updatedUser = {
      ...user,
      ...updatedUserField,
      role: userRole,
    };

    await this.userRepository.update(id, updatedUser);

    updatedUser['hasPassword'] = true;
    updatedUser['avatar'] = userAvatar;
    if (!updatedUser.password) {
      updatedUser['hasPassword'] = false;
    }

    delete updatedUser.password;

    return updatedUser;
  }

  async removeUser(
    currentUser: User,
    id: number,
    body: PaginationDto,
  ): Promise<IDeleteMessage> {
    const user = await this.userRepository.findOne(id);
    new CustomValidation().notFound('Користувача', 'ID', id, user);

    const theCurrentUser = currentUser.id === id;
    new CustomValidation().noAccess(theCurrentUser, 'admin');

    const orders = await this.ordersRepository.findOne({
      where: {
        user: { id: id },
      },
    });

    new CustomValidation().isOrderExists('Користувач', 'ID', id, orders);

    const result =
      (await this.userRepository.delete(id)) && (await this.getAllUsers(body));

    return {
      message: `Коментар з id: ${id} успішно видалено.`,
      ...result,
    };
  }

  async uploadImage(
    reqUserId: number,
    image: IFile,
    source: null | Source = null,
    oldAvatar: null | string = null,
  ): Promise<IResponseMessage> {
    const user = await this.userRepository.findOne(reqUserId);

    if (!user) {
      throw new UnauthorizedException();
    }

    await this.imageUtilsService.imageOptimize(image.filename, null, source);
    const { fileName, isPng } = this.imageUtilsService.getFileName(image);

    const result = await this.fileRepository.save({
      name: isPng ? `cropped-${fileName}.jpeg` : `cropped-${image.filename}`,
      user,
    });

    if (source === Source.avatar && oldAvatar) {
      await this.fileRepository.delete({ name: oldAvatar });
    }

    if (process.env.NODE_ENV !== 'local') {
      const file = [result.name];

      await this.imageUtilsService
        .uploadToStorage(file, source)
        .catch(console.error);
      await this.imageUtilsService.imageRemover(file);
      if (source === Source.avatar && oldAvatar) {
        await this.imageUtilsService.deleteFromStorage([oldAvatar]);
      }
    }

    return { message: result.name };
  }

  async changePassword(
    reqUserId: number,
    body: ChangePasswordDto,
  ): Promise<User> {
    const { confirmNewPassword, newPassword } = body;

    const user = await this.userRepository.findOne(reqUserId);
    new CustomValidation().passwordMismatch(newPassword, confirmNewPassword);
    new CustomValidation().userUnauthorized(reqUserId);
    const currentPassword = await compare(
      String(body.currentPassword),
      user.password,
    );
    if (!currentPassword) {
      throw new BadRequestException('Поточний пароль неправильний!');
    }
    body.newPassword = hashSync(body.newPassword, JSON.parse(process.env.SALT));
    body.confirmNewPassword = hashSync(
      body.confirmNewPassword,
      JSON.parse(process.env.SALT),
    );
    await this.userRepository.update(reqUserId, {
      password: body.newPassword,
    });
    delete user.password;
    return user;
  }

  async sendChangeEmail(body: SendChangeEmail): Promise<IResponseMessage> {
    const user = await this.userRepository.findOne(body.userId);

    new CustomValidation().notFound('Користувача', 'ID', body.userId, user);

    const emailExist = await this.userRepository.findOne({
      where: { email: body.newEmail },
    });
    if (emailExist) {
      throw new BadRequestException('Користувач з такою поштою вже існує');
    }

    const code = uuidv4();

    const oldConfirmTokens = await this.tokenRepository.find({
      userId: body.userId,
    });
    oldConfirmTokens
      ? await this.tokenRepository.remove(oldConfirmTokens)
      : null;

    await Promise.all([
      this.tokenRepository.save({ userId: user.id, token: code }),
      this.mailService.sendInviteChangeEmail(body.newEmail, code, user.id),
      this.mailService.sendInviteChangeEmailToCurrentMail(
        user.email,
        code,
        user.id,
      ),
    ]);

    return { message: 'Лист з підтвердженням відправлено на вказану адресу' };
  }

  async changeEmail(body: ChangeEmailDto): Promise<AuthResponse> {
    const { userId } = body;
    const code = await this.tokenRepository.findOne({
      where: { userId: userId },
    });

    if (!code) {
      throw new NotFoundException(
        'Користувач не надсилав запит на заміну пошти!',
      );
    }

    const isTokenProper = code.token === body.token;
    if (!isTokenProper) {
      throw new BadRequestException('Token не співпадає!');
    }

    const user = await this.userRepository.findOne(
      { id: userId },
      {
        relations: ['role'],
      },
    );

    if (!user) {
      throw new NotFoundException('Такого користувача не існує');
    }

    const oldEmail = user.email;
    const newUser = user;
    newUser.email = body.email;
    await Promise.all([
      this.tokenRepository.remove(code),
      this.userRepository.save(newUser),
      this.mailService.sendConfirmationEmailChange(user.email),
      this.mailService.sendConfirmationEmailChange(oldEmail),
    ]);

    delete newUser.password;
    const token = this.jwtService.sign({ ...user });

    return { token, user };
  }

  async sendEmailFromUser(body: ContactUsInterface): Promise<IResponseMessage> {
    const res = await this.mailService.sendEmailFromUser(body);
    if (res)
      return {
        message: 'Ваше повідомлення, успішно відправлено',
        success: true,
      };
    return {
      message: 'На жаль відправка повідовлення наразі недоступна',
      success: false,
    };
  }

  public async updateProfileUser(userData): Promise<User> {
    userData.phoneNumber = removeSpacesAndPlus(userData.phoneNumber);
    userData.currentPhoneNumber = removeSpacesAndPlus(
      userData.currentPhoneNumber,
    );
    const {
      id,
      firstName,
      lastName,
      phoneNumber: newPhoneNumber,
      currentPhoneNumber,
      roleId,
      email: newEmail,
      currentEmail,
      telegramId,
      dateOfBirth,
    } = userData;

    if (newPhoneNumber !== currentPhoneNumber) {
      const user = await this.userRepository.findOne({
        phoneNumber: newPhoneNumber,
      });
      if (user) throw new BadRequestException('Телефон вже використовуеться!');
    }

    if (newEmail !== currentEmail) {
      const user = await this.userRepository.findOne({ email: newEmail });
      if (user) throw new BadRequestException('Пошта вже використовуеться!');
      await this.tokenRepository.delete({ userId: id });
      const code = uuidv4();
      await Promise.all([
        this.tokenRepository.save({ userId: id, token: code }),
        this.mailService.sendInviteChangeEmail(newEmail, code, id, 'adminka'),
      ]);
    }

    await this.userRepository
      .createQueryBuilder()
      .update()
      .set({
        firstName: firstName,
        lastName: lastName,
        phoneNumber: newPhoneNumber,
        role: roleId,
        telegramId: telegramId,
        dateOfBirth: dateOfBirth,
      })
      .where('id = :id', { id: id })
      .execute();

    return await this.getProfile(id);
  }

  async resetPassword({ email }: ResendPasswordDto): Promise<IResponseMessage> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user)
        throw new NotFoundException(
          `Користувач з поштою ${email} не зареєстрований`,
        );
      new CustomValidation().emailNotConfirmed(user.status);

      // if the user has a token, we delete it
      await this.tokenRepository
        .createQueryBuilder()
        .delete()
        .where({ userId: user.id })
        .execute();

      const code = uuidv4();

      await Promise.all([
        this.tokenRepository.save({ userId: user.id, token: code }),
        this.mailService.sendPasswordInstallRequest(user.email, code, user.id),
      ]);

      return {
        message: 'Посилання на встановлення паролю відправлено!',
        success: true,
      };
    } catch (e) {
      return { message: e.message, success: false };
    }
  }

  async preInstallPassword(
    body: PreResetPasswordDto,
  ): Promise<IResponseMessage> {
    try {
      const { userId } = body;
      const code = await this.tokenRepository.findOne({
        where: { userId },
      });
      if (!code)
        throw new ForbiddenException(
          'Користувач не надсилав запит на встановлення паролю!',
        );
      if (code.token !== body.token)
        throw new ForbiddenException(
          'Це посилання не дійсне, так як ви зробили запит на ще одне, перейдіть, будь ласка, за ним!',
        );
      return { message: '', success: true };
    } catch (e) {
      return { message: e.message, success: false };
    }
  }

  async installPassword(body: ResetPasswordDto): Promise<User> {
    const { userId } = body;
    const code = await this.tokenRepository.findOne({
      where: { userId: userId },
    });
    if (!code)
      throw new NotFoundException(
        'Користувач не надсилав запит на встановлення паролю!',
      );

    const isTokenProper = code.token === body.token;
    if (!isTokenProper) {
      throw new BadRequestException('Код не співпадає!');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user)
      throw new NotFoundException(
        `Користувач з id ${userId} не зареєстрований`,
      );

    body.newPassword = hashSync(body.newPassword, JSON.parse(process.env.SALT));

    const newUser = user;
    newUser.password = body.newPassword;

    await Promise.all([
      this.tokenRepository.remove(code),
      this.userRepository.save(newUser),
    ]);
    delete newUser.password;
    return newUser;
  }

  async getSearchUsersByEmail(
    email: string,
    paginationDto: PaginationDto,
  ): Promise<GetUserByEmail> {
    const page = Number(paginationDto.page);
    const limit = Number(paginationDto.limit) || 40;
    const skippedItems = (page - 1) * limit;

    const [data, count]: [User[], number] = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.category', 'category')
      .leftJoinAndSelect('user.phone', 'phone')
      .leftJoinAndSelect('user.email', 'email')
      .leftJoinAndSelect('user.telegramId', 'telegramId')
      .leftJoinAndSelect('user.name', 'name')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email ILIKE :email AND user.disabled = false', {
        email: `%${email}%`,
      })
      .take(limit)
      .skip(skippedItems)
      .getManyAndCount();

    const totalPages = getTotalPages(count, limit, page);
    console.log(data);

    return { data, count, totalPages };
  }
}
