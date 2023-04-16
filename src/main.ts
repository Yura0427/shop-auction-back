require('dotenv').config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { SocketIoAdapter } from './socket/socket-console-adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors();

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('The API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api/v1/swagger-html', app, document);
  }

  app.useWebSocketAdapter(new SocketIoAdapter(app));

  await app.listen(JSON.parse(process.env.API_PORT));
  console.info(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
