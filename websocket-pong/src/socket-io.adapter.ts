import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

export class SocketIoAdapter extends IoAdapter {
  constructor(app: INestApplicationContext, private corsOrigins: string[] | boolean) {
    super(app);
  }

  createIOServer(port: number, options?: any): any {
    options = { ...options, cors: this.corsOrigins };
    return super.createIOServer(port, options);
  }
}
