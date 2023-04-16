import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MessageBody,
  WebSocketServer,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { EParserStatus } from 'src/shop-parser/utils/parserStatus.enum';
import { ParserSettings } from 'src/shop-parser/parserSettings.entity';
import { axiosInstance } from 'src/utils/axios-interceptors';
import { Repository } from 'typeorm';
import { SocketIoAdapter } from './socket-console-adapter';
import { Product } from 'src/product/product.entity';

@Injectable()
@WebSocketGateway(4001, { namespace: 'socket-console' })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @InjectRepository(ParserSettings)
    private parserSettingsRepository: Repository<ParserSettings>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  private readonly logger = new Logger(SocketIoAdapter.name);

  @WebSocketServer()
  server: Namespace;

  afterInit(server: any): void {
    this.logger.debug('Socket initialisation finished...');
  }

  handleConnection(client: Socket) {
    const sockets = this.server.sockets;

    this.logger.debug(`WS Client with id: ${client.id} conected!`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
  }

  handleDisconnect(client: Socket) {
    const sockets = this.server.sockets;

    this.logger.debug(`Disconected socket id: ${client.id}`);
    this.logger.debug(`Number of connected sockets: ${sockets.size}`);
  }

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() message: IParserLog): Promise<void> {
    const parserName = message.parser;

    try {
      const parserSettings = await this.parserSettingsRepository.findOne({
        parserName,
      });
      await this.parserSettingsRepository.save({
        ...parserSettings,
        lastMessage: message.data,
      });
    } catch (e) {
      this.server.emit('log', 'Can`t connect to DB', () => {
        console.log(`Can't connect to DB. ${message.data}`);
      });
    }
    message.newStatus = await this.parserSettingsRepository.findOne({
      parserName,
    });
    const allParsedProducts = await this.productRepository.find({
      where: { shopKey: parserName },
    });

    this.server.emit(
      'log',
      {
        ...message,
        newStatus: {
          ...message.newStatus,
          allParsedProducts: allParsedProducts?.length,
        },
      },
      () => {
        console.log(`${message.data}`);
      },
    );
  }

  @SubscribeMessage('STOP')
  async stopMessage(@MessageBody() message: IParserCommand): Promise<void> {
    const parserName = message.parser;

    try {
      const parserSettings = await this.parserSettingsRepository.findOne({
        parserName,
      });
      await this.parserSettingsRepository.save({
        ...parserSettings,
        parserStatus: EParserStatus.stopped,
        lastMessage: message.command,
        lastParsedProduct: message.lastParsedProduct || null,
        lastUpdate: new Date().toISOString(),
      });
    } catch (e) {
      this.handleMessage({
        parser: parserName,
        data: 'Can`t stop process. Unknown error',
      });
    }
    const newStatus = await this.parserSettingsRepository.findOne({
      parserName,
    });
    this.handleMessage({
      parser: parserName,
      data: message.command,
      newStatus,
    });
  }

  @SubscribeMessage('START')
  async startParser(
    @MessageBody() message: IParserCommand,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.saveStatusToDB(message);
    axiosInstance(client.handshake.auth.token).get(
      `http://localhost:4000/shop-parser/${message.parser}`,
    );
  }

  @SubscribeMessage('DELETE_ALL_PRODUCT_BY_KEY')
  async deleteAllProductsByKey(
    @MessageBody() message: IParserCommand,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.saveStatusToDB(message);
    if (message.key === 'whiteMandarin') {
      axiosInstance(client.handshake.auth.token).delete(
        `http://localhost:4000/shop-parser/whiteMandarin-delete`,
      );
    } else {
      axiosInstance(client.handshake.auth.token).delete(
        `http://localhost:4000/shop-parser/${message.key}?parserKey=${message.parser}`,
      );
    }
  }

  @SubscribeMessage('UPDATE_ALL')
  async updateAllMessage(
    @MessageBody() message: IParserCommand,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.saveStatusToDB(message);
    axiosInstance(client.handshake.auth.token).get(
      `http://localhost:4000/shop-parser/${message.parser}?update=true`,
    );
  }

  @SubscribeMessage('UPDATE_ONE')
  async updateOneMessage(
    @MessageBody() message: IParserCommand,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.saveStatusToDB(message);
    axiosInstance(client.handshake.auth.token).get(
      `http://localhost:4000/shop-parser/${message.parser}?update=true&key=${message.key}`,
    );
  }

  async saveStatusToDB(message: IParserCommand): Promise<void> {
    const parserName = message.parser;

    try {
      const parserSettings = await this.parserSettingsRepository.findOne({
        parserName,
      });
      await this.parserSettingsRepository.save({
        ...parserSettings,
        parserStatus: EParserStatus.started,
        lastMessage: '',
        lastStart: new Date().toISOString(),
      });
    } catch (e) {
      await this.stopMessage({
        parser: parserName,
        command: 'Can`t read parser settings ' + e.message,
      });
    }
  }

  async saveParserErrorToDB({
    parser,
    lastParsedProduct,
    errorStatus,
    lastError,
  }: IParserError): Promise<void> {
    const parserName = parser;

    try {
      const parserSettings = await this.parserSettingsRepository.findOne({
        parserName,
      });

      await this.parserSettingsRepository.save({
        ...parserSettings,
        lastParsedProduct,
        errorStatus,
        lastError: lastError === null ? lastError : new Date().toISOString(),
        parserStatus: EParserStatus.stopped,
      });
    } catch (e) {
      await this.stopMessage({
        parser: parserName,
        command: 'Can`t read parser settings ' + e.message,
      });
    }
  }
}

export interface IParserCommand {
  parser: string;
  command: string;
  lastParsedProduct?: number;
  key?: string;
}

export interface IParserError {
  parser: string;
  errorStatus?: number;
  lastParsedProduct?: number;
  lastError?: Date | null;
}
export interface IParserLog {
  parser: string;
  data: string;
  newStatus?: ParserSettings;
}
export interface IParserStatus {
  parser: string;
}
