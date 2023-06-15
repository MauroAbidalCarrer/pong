import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
type Player = {
    socketId: number;
    y: number;
};
type GameState = {
    ball: {
        x: number;
        y: number;
        directionX: number;
        directionY: number;
    };
    players: [Player, Player];
};
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
