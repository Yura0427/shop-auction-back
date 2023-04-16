import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import * as TelegramBot from 'node-telegram-bot-api';

import { NewOrderMessageDto } from './dto/newOrderMessage.dto';
import { User } from 'src/user/user.entity';
import { Role } from '../user/role/role.entity';

@Injectable()
export class BotService implements OnModuleInit {
  bot: TelegramBot = null;
  token: string = process.env.TOKEN_TELEGRAM_BOT;

  onModuleInit() {
    if (!this.bot && process.env.IS_AVAILABLE_BOT === 'true') {
      this.bot = new TelegramBot(this.token, { polling: true });
      this.startBot().then().catch();
    }
  }

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  formatPhoneNumber(number: string): string {
    let phone_numeric = number.replace(/[^\d]+/g, '');
    let phone_formatted = '';

    switch (phone_numeric.length) {
      case 12: {
        phone_formatted = phone_numeric.replace(
          /(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/,
          '+$1 $2 $3 $4 $5',
        );
        break;
      }
      case 10: {
        phone_formatted = phone_numeric.replace(
          /(\d{1})(\d{2})(\d{3})(\d{2})(\d{2})/,
          '+38$1 $2 $3 $4 $5',
        );
        break;
      }
    }

    return phone_formatted;
  }

  async startBot(): Promise<void> {
    this.bot.on('message', async (msg) => {
      const { id } = msg.from;

      const btnOptions = {
        reply_markup: {
          keyboard: [
            [{ text: 'Відправити номер телефону', request_contact: true }],
          ],
          one_time_keyboard: true,
        },
      };

      switch (msg.text) {
        case `\u002Fstart`:
          const user = await this.userRepository.findOne({
            where: {
              telegramId: id,
            },
          });
          user
            ? await this.bot.sendMessage(
                id,
                `З поверненням, ${msg.from.first_name}!\nЯкщо бажаете перевірити статус свого користувача натисніть\n/check_status`,
              )
            : await this.bot.sendMessage(
                id,
                'Дайте дозвіл на отримання вашого номеру телефону',
                btnOptions,
              );
          break;
        case '/check_status':
          await this.bot.sendMessage(
            id,
            'Дайте дозвіл на отримання вашого номеру телефону',
            btnOptions,
          );
          break;
        default:
          if (msg.contact) break;
          await this.bot.sendMessage(id, 'Для початку роботи введіть /start');
      }

      await this.addNewUser(msg);
    });
  }

  private async addNewUser(msg) {
    const chatId = msg.chat.id;

    if (!msg.contact) return;

    const { user_id, first_name, last_name, phone_number } = msg.contact;
    const formattedPhoneNumber = this.formatPhoneNumber(phone_number);

    const existUser = await this.userRepository.findOne({
      where: { phoneNumber: formattedPhoneNumber },
      relations: ['role'],
    });

    let telegramIdEmptyText = ``;

    if (existUser) {
      if (existUser.telegramId != user_id) {
        const updatedUser: User = {
          ...existUser,
          telegramId: user_id,
        };

        telegramIdEmptyText = ` Йому було присвоєно telegramId = ${user_id}.`;

        await this.userRepository.save(updatedUser);
      }

      let notAdminMessage = `Ви маєте роль admin і можете отримувати повідомлення про нові ордери.`;

      if (existUser.role.name !== 'admin') {
        notAdminMessage =
          'Будь ласка зверніться до адміністратора, щоб мати можливість отримувати повідомлення про нові ордери.';
      }

      const message = `Такий користувач уже існує.${telegramIdEmptyText} ${notAdminMessage}`;
      await this.bot.sendMessage(chatId, message);
      return;
    }

    await this.bot.sendMessage(
      chatId,
      `Такого користувача не існує. Вам необхідно зареєструватись на сайті:\nhttps://buy-all.store/`,
    );
  }

  async sendMessageAllAdmins(data: NewOrderMessageDto) {
    const admins = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .addSelect('role.name')
      .where('role.name = :name', { name: 'admin' })
      .andWhere('user.telegramId !=:null', { null: Not(IsNull()) })
      .getMany();

    const message = `Користувач: ${data.userName}, створив новий ордер на суму ${data.orderPrice} грн, з кількістю товарів ${data.numberGoods}.`;
    admins.forEach((admin) => {
      this.bot.sendMessage(admin.telegramId, message).catch((_) => {});
    });
  }
}
