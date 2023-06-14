import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
type Player = {
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
    clients: Socket[];
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    startGame(): void;
    handlePlayerMove(client: Socket, payload: {
        playerIndex: number;
        y: number;
    }): void;
}
export {};
