import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';

import { AuthDto, VerifyAccountDto } from './auth.dto';
import { AuthResponse, GoogleAuthRes } from './auth';
import { IUserValidationStrategy } from '@shared/strategires/strategy';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { CustomValidation } from 'src/utils/custom-validation';
import { CreateGoogleUser } from 'src/user/dto/create-google-user.dto';
import { CreateFBUser } from 'src/user/dto/create-fb-user.dto';
import { UserService } from 'src/user/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserStatus } from 'src/user/user.entity';
import { ConfirmationToken } from 'src/user/confirmation-token.entity';
import { UserRoleEnum } from '../user/user.enum';

import { RoleService } from '../user/role/role.service';
import { MailService } from '../mail/mail.service';
import { GoogleService } from './google/google.service';
import { CreateCutUserDto } from '../user/dto/create-cut-user.dto';
import { CutUserRegisterResponse } from './auth';
import { IResponseMessage } from '../interfaces/response-message.interface';
import { CreateUserThroughAdminDto } from 'src/user/dto/create-user-through-admin.dto';
import { ResendMessageDto } from './dto/resend-message.dto';
import addSpacesAndPlus from 'src/utils/addSpacesAndPlus';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ConfirmationToken)
    private readonly confirmationTokenRepository: Repository<ConfirmationToken>,
    private readonly userService: UserService,
    private readonly googleService: GoogleService,
    private readonly roleService: RoleService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  public async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne(email);

    if (!user) {
      throw new HttpException(
        'Такого користувача не існує',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const areEqual = await compare(String(password), user.password);

    if (!areEqual) {
      throw new HttpException('Паролі не співпадають', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }

  public async login(
    body: AuthDto,
    strategy?: IUserValidationStrategy,
  ): Promise<AuthResponse> {
    const user = await this.userRepository.findOne(
      { email: body.email },
      {
        relations: ['role'],
      },
    );

    if (!user) {
      throw new HttpException(
        'Такого користувача не існує',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const updatedUser = { ...user, hasPassword: true };

    if (!updatedUser.password) {
      updatedUser.hasPassword = false;
      throw new HttpException(
        'У вас не встановлений пароль. Спробуйте авторизуватись через google або натисніть на кнопку "Забули пароль?", щоб встановити пароль.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (updatedUser.status !== UserStatus.CONFIRMED) {
      throw new HttpException(
        'Вам потрібно підтвердити ваш email для успішного логіна',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    if (strategy) {
      strategy.validate(updatedUser);
    }

    const googleUser = await this.userRepository.findOne({
      where: { id: updatedUser.id, password: null },
    });
    if (googleUser) {
      throw new UnauthorizedException();
    }

    const areEqual = await compare(String(body.password), updatedUser.password);

    if (!areEqual) {
      throw new HttpException('Неправильний пароль', HttpStatus.UNAUTHORIZED);
    }

    delete updatedUser.password;
    const token = this.jwtService.sign({ ...updatedUser });
    await this.userRepository.save(updatedUser);

    updatedUser.phoneNumber = addSpacesAndPlus(user.phoneNumber);

    return { token, user: updatedUser };
  }

  public async registerUser(body: CreateUserDto): Promise<AuthResponse> {
    return await this.registerUserWithRole(body, UserRoleEnum.user);
  }

  public async registerUserThroughAdmin({
    roleId,
    ...body
  }: CreateUserThroughAdminDto): Promise<IResponseMessage> {
    body.phoneNumber = this.removeSpacesAndPlus(body.phoneNumber);
    const { email, phoneNumber } = body;

    const isExists = await this.userRepository.findOne({
      where: [{ email: email }, { phoneNumber: phoneNumber }],
    });

    new CustomValidation().isExists(
      'Користувач',
      'такою адресою',
      'або телефоном',
      isExists,
    );
    const userRole = await this.roleService.findById(roleId);
    const userParam = { role: userRole, ...body };
    const user = await this.userRepository.save(userParam);
    const token = uuidv4();
    await Promise.all([
      this.confirmationTokenRepository.save({ userId: user.id, token }),
      this.mailService.sendInvintationEmail(
        user.email,
        token,
        user.id,
        user.lastName,
      ),
    ]);

    return { message: 'Користувач успішно доданий' };
  }

  private removeSpacesAndPlus(phoneNumber: string): string {
    return phoneNumber.replace(/\D/g, '');
  }

  public async verifyAccount(body: VerifyAccountDto): Promise<AuthResponse> {
    const isExistsUser = await this.userRepository.findOne({
      where: { id: body.userId },
    });
    const confirmToken = await this.confirmationTokenRepository.findOne({
      userId: body.userId,
    });

    if (confirmToken) {
      const tokenLifeTime = +process.env.CONFIRM_TOKEN_LIFE_TIME;
      const lifeTimeConfirmToken =
        new Date().getTime() - new Date(confirmToken?.createdAt).getTime();

      if (lifeTimeConfirmToken > tokenLifeTime) {
        await this.confirmationTokenRepository.remove(confirmToken);
        new CustomValidation().noVerifyAccount(isExistsUser?.status);
      }
    }

    const isTokenProper = confirmToken?.token === body.token;

    if (!confirmToken || !isTokenProper) {
      new CustomValidation().noExistConfirmToken();
    }

    const user = await this.userRepository.findOne({ id: body.userId });
    const token = this.jwtService.sign({ ...user });

    await Promise.all([
      this.confirmationTokenRepository.remove(confirmToken),
      this.userRepository.update(body.userId, { status: UserStatus.CONFIRMED }),
    ]);

    const updatedUser = {
      ...user,
      hasPassword: true,
    };

    if (!user.password) {
      updatedUser.hasPassword = false;
    } else {
      delete updatedUser.password;
    }
    return { token, user: updatedUser };
  }

  private async registerUserWithRole(
    body: CreateUserDto,
    userRole?: string,
  ): Promise<AuthResponse> {
    body.role = await this.roleService.findByName(userRole);
    try {
      return await this.register(body);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async accessToken(user): Promise<AuthResponse> {
    const token = uuidv4();
    await Promise.all([
      this.confirmationTokenRepository.save({
        userId: user.id,
        token: token,
      }),
      this.mailService.sendInvintationEmail(user.email, token, user.id),
    ]);

    const accessToken = this.jwtService.sign(
      { ...user },
      {
        secret: process.env.SECRET_KEY,
        expiresIn: '2h',
      },
    );

    return { user, token: accessToken };
  }

  private async register(body: CreateUserDto): Promise<AuthResponse> {
    body.phoneNumber = this.removeSpacesAndPlus(body.phoneNumber);
    const { email, phoneNumber } = body;
    const isExistsUser = await this.userRepository.findOne({
      where: [{ phoneNumber: phoneNumber }, { email: email }],
    });

    if (isExistsUser) {
      throw new HttpException(
        `Такий номер або пошта вже використовується іншим користувачем`,
        HttpStatus.CONFLICT,
      );
    }

    const user = await this.userService.createUser(body);
    const updatedUser = {
      ...user,
      hasPassword: true,
      phoneNumber: addSpacesAndPlus(user.phoneNumber),
    };

    if (!user.password) {
      updatedUser.hasPassword = false;
    } else {
      delete updatedUser.password;
    }

    return await this.accessToken(updatedUser);
  }

  async resendMessage(body: ResendMessageDto): Promise<AuthResponse> {
    const { email } = body;
    const user = await this.userRepository.findOne({
      where: { email: email },
    });

    const confirmToken = await this.confirmationTokenRepository.findOne({
      userId: user.id,
    });

    if (confirmToken) {
      await this.confirmationTokenRepository.remove(confirmToken);
    }

    const token = uuidv4();
    await Promise.all([
      this.confirmationTokenRepository.save({
        userId: user.id,
        token: token,
      }),
      this.mailService.sendInvintationEmail(user.email, token, user.id),
    ]);

    const jwtToken = this.jwtService.sign({ ...user });
    return { user, token: jwtToken };
  }

  async registerCutUser(
    body: CreateCutUserDto,
  ): Promise<CutUserRegisterResponse> {
    body.phoneNumber = this.removeSpacesAndPlus(body.phoneNumber);
    const { phoneNumber, email } = body;

    const existingPhoneUser = await this.userRepository.findOne({
      where: [{ phoneNumber: phoneNumber }],
    });
    const existingEmailUser = await this.userRepository.findOne({
      where: [{ email: email }],
    });
    if (existingPhoneUser && existingEmailUser) {
      throw new HttpException(
        'Користувач з таким номером і поштою уже зареєстрований. Увійдіть, щоб продовжити оформлення замовлення',
        HttpStatus.CONFLICT,
      );
    }
    if (existingPhoneUser) {
      throw new HttpException(
        'Користувач з таким номером уже зареєстрований. Увійдіть, щоб продовжити оформлення замовлення',
        HttpStatus.CONFLICT,
      );
    }
    if (existingEmailUser) {
      throw new HttpException(
        'Користувач з такою поштою уже зареєстрований. Увійдіть, щоб продовжити оформлення замовлення',
        HttpStatus.CONFLICT,
      );
    }

    const user = await this.userService.createCutUser(body);
    const updatedUser = { ...user, hasPassword: false };

    if (updatedUser.password) {
      updatedUser.hasPassword = true;
    }

    updatedUser.phoneNumber = addSpacesAndPlus(updatedUser.phoneNumber);

    const { token } = await this.accessToken(updatedUser);
    return { user: updatedUser, token };
  }

  public async googleLogIn({ googleId, givenName, familyName, email }: CreateGoogleUser): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      const updatedUser = { ...user, hasPassword: false };
      if (!user.googleId) updatedUser.googleId = googleId;
      if (user.password) {
        updatedUser.hasPassword = true;
        delete updatedUser.password;
      }
      await this.userRepository.save(updatedUser);
      const returnUser = {
        ...updatedUser,
        phoneNumber: addSpacesAndPlus(updatedUser.phoneNumber),
      };
      const token = this.jwtService.sign(returnUser);
      return { token, user: returnUser };
    }

    const newUser = {
      firstName: givenName,
      lastName: familyName,
      email: email,
      googleId: googleId,
      dateOfBirth: null,
      phoneNumber: null,
      status: UserStatus.CONFIRMED,
      role: await this.roleService.findByName('user'),
    };

    const createUser = await this.userRepository.save(newUser);
    delete createUser.password;

    const token = this.jwtService.sign(createUser);

    return { token, user: { ...createUser, hasPassword: false } };
  }

  public async fbLogin(body: CreateFBUser): Promise<AuthResponse> {
    const { id, name, email } = body;
    new CustomValidation().socialUnauthorized(id);

    const [firstName, lastName] = name.split(' ');

    const fbEmail = body.email;
    const user = await this.userRepository.findOne({
      where: { email: fbEmail },
    });
    if (user) {
      const token = this.jwtService.sign({ ...user });
      return { token, user };
    }
    const createUser = await this.userRepository.save({
      firstName: firstName,
      lastName: lastName,
      email: email,
      facebookId: id,
    });
    const token = this.jwtService.sign({ ...createUser });

    return { token, user: createUser };
  }
}
