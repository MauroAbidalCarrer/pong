import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameSession } from './gameSession';
export declare class PongGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    clientSocketsQueue: Socket[];
    gameSessions: GameSession[];
    nextDebugSessionId: number;
    constructor();
    handleConnection(clientSocket: Socket): void;
    handleDisconnect(clientScoket: Socket): void;
    update(): void;
}
