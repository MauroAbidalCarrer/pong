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
const simpleMath_1 = require("./simpleMath");
const canvasWidth = 800;
const canvasHeight = 600;
const playerWidth = 30;
const playerOffset = 10;
const playerHeight = 100;
const leftPlayerX = playerOffset + playerWidth;
const rightPlayerX = canvasWidth - playerOffset - playerWidth;
const ballRadius = 15;
const interval = 1000 / 30;
const deltaTime = 1 / 30;
class Ball {
    constructor() {
        this.pos = new simpleMath_1.Vector2D(0, 0);
        this.horizontalMovement = 1;
        this.verticalMovement = 0;
    }
    checkOverlap(playerPos) {
        let closestX = (0, simpleMath_1.clamp)(this.pos.x - playerPos.x, -playerWidth / 2, playerWidth / 2) + playerPos.x;
        let closestY = (0, simpleMath_1.clamp)(this.pos.y - playerPos.y, -playerHeight / 2, playerHeight / 2) + playerPos.y;
        var distanceX = this.pos.x - closestX;
        var distanceY = this.pos.y - closestY;
        var distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared <= (ballRadius * ballRadius);
    }
    bounceOffPlayer(playerPos) {
        let dir = new simpleMath_1.Vector2D(this.pos.x - playerPos.x, this.pos.y - playerPos.y);
        dir.normalize();
        this.horizontalMovement *= -1;
        this.verticalMovement = dir.y * 90;
    }
    givepointToPlayer(player) {
        this.pos = new simpleMath_1.Vector2D(canvasWidth / 2, canvasHeight / 2);
        player.points++;
    }
    move(gameState) {
        this.pos.x += this.horizontalMovement * canvasWidth * deltaTime;
        this.pos.y += this.verticalMovement * deltaTime;
        let leftPlayerPos = new simpleMath_1.Vector2D(leftPlayerX, gameState.players[0].y);
        if (this.checkOverlap(leftPlayerPos) && this.horizontalMovement === -1)
            this.bounceOffPlayer(leftPlayerPos);
        let rightPlayerPos = new simpleMath_1.Vector2D(rightPlayerX, gameState.players[1].y);
        if (this.checkOverlap(rightPlayerPos) && this.horizontalMovement === 1)
            this.bounceOffPlayer(rightPlayerPos);
        if (this.pos.y > canvasHeight - ballRadius || this.pos.y < ballRadius)
            this.verticalMovement *= -1;
        if (this.pos.x > canvasWidth - ballRadius) {
            console.log("giving point to left player.");
            this.givepointToPlayer(gameState.players[0]);
        }
        if (this.pos.x < ballRadius) {
            console.log("giving point to right player.");
            this.givepointToPlayer(gameState.players[1]);
        }
    }
}
let PongGateway = exports.PongGateway = class PongGateway {
    constructor() {
        this.gameState = {
            ball: new Ball(),
            players: [
                { y: 0, socketId: 0, points: 0 },
                { y: 0, socketId: 0, points: 0 },
            ],
        };
        this.clientSockets = [];
    }
    handleConnection(clientSocket) {
        this.clientSockets.push(clientSocket);
        console.log('clientSocket connected:', clientSocket.id);
        clientSocket.emit('assign-player', this.clientSockets.indexOf(clientSocket));
        if (this.clientSockets.length === 2) {
            this.startGame();
        }
    }
    handleDisconnect(clientSocket) {
        console.log('clientSocket disconnected:', clientSocket.id);
        this.clientSockets = this.clientSockets.filter((c) => c.id !== clientSocket.id);
        this.gameState = {
            ball: new Ball(),
            players: [
                { y: 300, socketId: 0, points: 0 },
                { y: 300, socketId: 0, points: 0 },
            ],
        };
    }
    startGame() {
        this.server.emit('update-game', this.gameState);
        setInterval(() => {
            this.gameState.ball.move(this.gameState);
            this.server.emit('update-game', this.gameState);
        }, interval);
    }
    handlePlayerMove(clientSocket, payload) {
        let playerIndex = this.clientSockets.findIndex(cs => cs === clientSocket);
        this.gameState.players[playerIndex].y = payload.y;
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
    (0, websockets_1.WebSocketGateway)(8080)
], PongGateway);
//# sourceMappingURL=pong-gateway.gateway.js.map