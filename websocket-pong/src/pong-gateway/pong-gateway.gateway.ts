import {
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameSession } from './gameSession';

const interval: number = 1000 / 30

@WebSocketGateway(8080)
export class PongGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // clientSocket connections list
  clientSocketsQueue: Socket[] = [];
  gameSessions: GameSession[] = []
  nextDebugSessionId: number = 0

  constructor() {
    setInterval(() => this.update(), interval)
  }

  handleConnection(clientSocket: Socket) {
    // When a new clientSocket connects, add them to the list of clientSockets
    this.clientSocketsQueue.push(clientSocket);
    // console.log('clientSocket connected:', clientSocket.id, ", clientScokets.length: ", this.clientSocketsQueue.length, ", clientScokets: ", this.clientSocketsQueue.map(cs => cs.id));

    // If we have two players, start the game
    if (this.clientSocketsQueue.length >= 2) {
      let clientSocket1 = this.clientSocketsQueue.pop()
      let clientSocket2 = this.clientSocketsQueue.pop()
      console.log(`Client CONNECTED, creating game session ${this.nextDebugSessionId}`)
      this.gameSessions.push(new GameSession(clientSocket1, clientSocket2, this.nextDebugSessionId))
      this.nextDebugSessionId += 1
      console.log(`Sessions count: ${this.gameSessions.length}, [${this.gameSessions.map(session => session.debugId)}]`)
    }
    else{
      console.log(`Client CONNECTED, added to queue, queue.length = ${this.clientSocketsQueue.length}`)
      clientSocket.emit('in-queue')
    }
  }

  handleDisconnect(clientScoket: Socket) {
    this.clientSocketsQueue = this.clientSocketsQueue.filter(cs => cs !== clientScoket)
    console.log(`Client DISCONNECTED, sessions count: ${this.gameSessions.length}, [${this.gameSessions.map(session => session.debugId)}]`)
  }

  update() {
    this.gameSessions = this.gameSessions.filter(session => {
      session.update()
      return session.gameIsOver === false
    })
  }
}
