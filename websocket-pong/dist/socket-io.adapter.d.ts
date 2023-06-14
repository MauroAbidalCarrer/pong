import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
export declare class SocketIoAdapter extends IoAdapter {
    private corsOrigins;
    constructor(app: INestApplicationContext, corsOrigins: string[] | boolean);
    createIOServer(port: number, options?: any): any;
}
