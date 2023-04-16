import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';

import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: +process.env.SMTP_PORT,
        secure: JSON.parse(process.env.SMTP_SECURE),
        auth: {
          user: process.env.SMTP_USER,
          pass:  process.env.SMTP_PASSWORD,
        },
      },
      defaults: {
        from: '<noreply@buy-all.store>'
      },
      template: {
        dir: process.cwd() + '/dist/src/mail/templates/',
        adapter: new PugAdapter(),
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService]
})
export class MailModule {}
