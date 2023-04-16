import { Inject, Injectable } from '@nestjs/common';
import { MailerService, ISendMailOptions } from '@nestjs-modules/mailer';
import { ContactUsInterface } from '../interfaces/contactUs.interface';
import { Order } from '../orders/orders.entity';
import { DeliveryDto } from '../delivery/dto/delivery.dto';

@Injectable()
export class MailService {
  constructor(
    @Inject(MailerService)
    private mailerService: MailerService,
  ) {}

  public sendInvintationEmail(
    to: string,
    token: string,
    userId: number,
    lastName = 'unknown',
  ): Promise<boolean> {
    const confirmationUrl = `${process.env.FRONT_FULL_LINK}/${process.env.CONFIRMATION_LINK}?code=${token}&userId=${userId}`;
    const frontUrl = `${process.env.FRONT_FULL_LINK}`;

    return this.sendMailPromise({
      to,
      template: 'register-invite',
      subject: 'Email confirmation',
      text: `Hello ${lastName}, please Confirm your email`,
      context: {
        url: confirmationUrl,
        frontUrl,
      },
    });
  }

  public sendInviteChangeEmail(
    to: string,
    code: string,
    userId: number,
    whereRedirect?: string,
  ): Promise<boolean> {
    const requestUrl =
      whereRedirect === 'adminka'
        ? `${process.env.ADMIN_PAGE_URL}/${process.env.REQUEST_LINK_CHANGE_EMAIL}?code=${code}&email=${to}&userId=${userId}`
        : `${process.env.FRONT_FULL_LINK}/${process.env.REQUEST_LINK_CHANGE_EMAIL}?code=${code}&email=${to}&userId=${userId}`;
    return this.sendMailPromise({
      to,
      template: 'change-email',
      subject: 'Confirm change email',
      text: 'Follow link to change Email',
      context: {
        url: requestUrl,
      },
    });
  }
  public sendInviteChangeEmailToCurrentMail(
    to: string,
    code: string,
    userId: number,
    whereRedirect?: string,
  ): Promise<boolean> {
    const requestUrl =
      whereRedirect === 'adminka'
        ? `${process.env.ADMIN_PAGE_URL}/${process.env.REQUEST_LINK_INSTALL_PASSWORD}?code=${code}&email=${to}&userId=${userId}`
        : `${process.env.FRONT_FULL_LINK}/${process.env.REQUEST_LINK_INSTALL_PASSWORD}?code=${code}&email=${to}&userId=${userId}`;
    return this.sendMailPromise({
      to,
      template: 'change-email-current-mail',
      subject: 'Confirm change email',
      text: 'Follow link to change Email',
      context: {
        url: requestUrl,
      },
    });
  }

  public sendConfirmationEmailChange(to: string): Promise<boolean> {
    const frontUrl = `${process.env.FRONT_FULL_LINK}/${process.env.REQUEST_LINK_PERSONAL_INFORMATION}`;
    return this.sendMailPromise({
      to,
      template: 'mail-changed-successfully',
      subject: 'Confirm change email',
      text: 'Mail changed',
      context: {
        url: frontUrl,
      },
    });
  }

  public sendEmailFromUser(data: ContactUsInterface): Promise<boolean> {
    const { email, name, text } = data;
    const to = process.env.SMTP_USER;
    return this.sendMailPromise({
      to,
      template: 'feed-back',
      subject: 'Feedback',
      context: {
        name,
        text,
        email,
      },
    });
  }

  public sendEmailWithSuccessOrder(
    to: string,
    firstName: string,
    phoneNumber: string,
    order: Order,
    delivery: DeliveryDto,
  ): Promise<boolean> {
    const { FRONT_FULL_LINK } = process.env;
    const imageRoot =
      process.env.NODE_ENV !== 'local'
        ? `https://api.${process.env.FRONT_DOMAIN}/static/uploads`
        : `http://localhost:${process.env.API_PORT}/static/uploads`;

    return this.sendMailPromise({
      to,
      template: 'success-order',
      subject: `Ваше замовлення №${order.id} прийнято до роботи`,
      context: {
        FRONT_FULL_LINK,
        imageRoot,
        firstName,
        phoneNumber,
        order,
        delivery,
        orderDate: order.updatedAt
          ? new Date(order.updatedAt).toLocaleDateString()
          : new Date().toLocaleDateString(),
      },
    });
  }

  public sendPasswordInstallRequest(
    to: string,
    token: string,
    userId: number,
  ): Promise<boolean> {
    const requestUrl = `${process.env.FRONT_FULL_LINK}/${process.env.REQUEST_LINK_INSTALL_PASSWORD}?code=${token}&userId=${userId}`;

    return this.sendMailPromise({
      to,
      template: 'install-password',
      subject: 'Password Installation',
      text: 'Follow link to install Password',
      context: {
        requestUrl,
      },
    });
  }

  private sendMailPromise(options: ISendMailOptions): Promise<boolean> {
    options.from =
      `<${process.env.SMTP_BASE_FROM}>` || `<${process.env.FROM_SENDER}>`;

    return new Promise((res, rej) => {
      this.mailerService.sendMail(options).then(res).catch(rej);
    });
  }
}
