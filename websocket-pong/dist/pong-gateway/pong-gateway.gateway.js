"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PongGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const gameSession_1 = require("./gameSession");
const interval = 1000 / 30;
let PongGateway = exports.PongGateway = class PongGateway {
    constructor() {
        this.clientSocketsQueue = [];
        this.gameSessions = [];
        this.nextDebugSessionId = 0;
        setInterval(() => this.update(), interval);
    }
    handleConnection(clientSocket) {
        this.clientSocketsQueue.push(clientSocket);
        if (this.clientSocketsQueue.length >= 2) {
            let clientSocket1 = this.clientSocketsQueue.pop();
            let clientSocket2 = this.clientSocketsQueue.pop();
            console.log(`Client CONNECTED, creating game session ${this.nextDebugSessionId}`);
            this.gameSessions.push(new gameSession_1.GameSession(clientSocket1, clientSocket2, this.nextDebugSessionId));
            this.nextDebugSessionId += 1;
            console.log(`Sessions count: ${this.gameSessions.length}, [${this.gameSessions.map(session => session.debugId)}]`);
        }
        else {
            console.log(`Client CONNECTED, added to queue, queue.length = ${this.clientSocketsQueue.length}`);
            clientSocket.emit('in-queue');
        }
    }
    handleDisconnect(clientScoket) {
        this.clientSocketsQueue = this.clientSocketsQueue.filter(cs => cs !== clientScoket);
        console.log(`Client DISCONNECTED, sessions count: ${this.gameSessions.length}, [${this.gameSessions.map(session => session.debugId)}]`);
    }
    update() {
        this.gameSessions = this.gameSessions.filter(session => {
            session.update();
            return session.gameIsOver === false;
        });
    }
};
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], PongGateway.prototype, "server", void 0);
exports.PongGateway = PongGateway = __decorate([
    (0, websockets_1.WebSocketGateway)(8080),
    __metadata("design:paramtypes", [])
], PongGateway);
//# sourceMappingURL=pong-gateway.gateway.js.map