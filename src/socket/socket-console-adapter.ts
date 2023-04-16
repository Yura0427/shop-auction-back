import { INestApplicationContext, Logger } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { ServerOptions } from "socket.io";

export class SocketIoAdapter extends IoAdapter {
    private readonly logger = new Logger(SocketIoAdapter.name)

    constructor(
        private app: INestApplicationContext,
    ) {
        super(app)
    }

    createIOServer(port: number, options?: ServerOptions) {
        const clientPort = process.env.SOCKET_CLIENT_PORT

        const cors = {origin: '*'};

        this.logger.debug('Configuration socket with CORS...')
        
        const optionWithCORS: ServerOptions = {
            ...options,
            cors,
        };
        
        return super.createIOServer(port, optionWithCORS)
    }
}