"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const socket_io_adapter_1 = require("./socket-io.adapter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.useWebSocketAdapter(new socket_io_adapter_1.SocketIoAdapter(app, ['*']));
    await app.listen(3001);
}
bootstrap();
//# sourceMappingURL=main.js.map