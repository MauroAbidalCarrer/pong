import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Vector2D } from './simpleMath';
type Player = {
    socketId: number;
    y: number;
    points: number;
    won: boolean;
};
type GameState = {
    ball: Ball;
    players: [Player, Player];
};
declare class Ball {
    pos: Vector2D;
    horizontalMovement: number;
    verticalMovement: number;
    checkOverlap(playerPos: Vector2D): boolean;
    bounceOffPlayer(playerPos: Vector2D): void;
    givepointToPlayer(player: Player): void;
    move(gameState: GameState): void;
}
export declare class PongGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    gameState: GameState;
    clientSockets: Socket[];
    handleConnection(clientSocket: Socket): void;
    handleDisconnect(clientSocket: Socket): void;
    startGame(): void;
    handlePlayerMove(clientSocket: Socket, payload: {
        y: number;
    }): void;
}
export {};
