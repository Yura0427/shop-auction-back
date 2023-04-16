import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserSessionCache } from './utils/users-sessions/user-session-cache';

@WebSocketGateway({ cors: true })
export class AppGateway implements OnGatewayDisconnect {
  constructor(private userSessionCache: UserSessionCache) {}

  @SubscribeMessage('newConnection')
  public async handleNewConnection(client: Socket) {
    this.userSessionCache.addNewUserSession(client.id);
  }

  handleDisconnect(client: Socket) {
    this.userSessionCache.remove(client.id);
  }
}
