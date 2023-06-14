"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketIoAdapter = void 0;
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
class SocketIoAdapter extends platform_socket_io_1.IoAdapter {
    constructor(app, corsOrigins) {
        super(app);
        this.corsOrigins = corsOrigins;
    }
    createIOServer(port, options) {
        options = Object.assign(Object.assign({}, options), { cors: this.corsOrigins });
        return super.createIOServer(port, options);
    }
}
exports.SocketIoAdapter = SocketIoAdapter;
//# sourceMappingURL=socket-io.adapter.js.map