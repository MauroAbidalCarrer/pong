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
let PongGateway = exports.PongGateway = class PongGateway {
    constructor() {
        this.gameState = {
            ball: {
                x: 0,
                y: 0,
                directionX: 1,
                directionY: 0,
            },
            players: [
                { y: 0 },
                { y: 0 },
            ],
        };
        this.clients = [];
    }
    handleConnection(client) {
        this.clients.push(client);
        console.log('Client connected:', client.id);
        if (this.clients.length === 2) {
            this.startGame();
        }
    }
    handleDisconnect(client) {
        console.log('Client disconnected:', client.id);
        this.clients = this.clients.filter((c) => c.id !== client.id);
        this.gameState = {
            ball: {
                x: 0,
                y: 0,
                directionX: 1,
                directionY: 0,
            },
            players: [
                { y: 0 },
                { y: 0 },
            ],
        };
    }
    startGame() {
        this.gameState.ball.x = 400;
        this.gameState.ball.y = 300;
        this.gameState.players[0].y = 300;
        this.gameState.players[1].y = 300;
        this.server.emit('update-game', this.gameState);
    }
    handlePlayerMove(client, payload) {
        this.gameState.players[payload.playerIndex].y = payload.y;
        this.server.emit('update-game', this.gameState);
    }
};
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], PongGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('player-move'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], PongGateway.prototype, "handlePlayerMove", null);
exports.PongGateway = PongGateway = __decorate([
    (0, websockets_1.WebSocketGateway)(3000)
], PongGateway);
//# sourceMappingURL=pong-gateway.gateway.js.map