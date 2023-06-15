import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

// Define the GameState and Player type
type Player = {
  socketId: number
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

@WebSocketGateway(8080)
export class PongGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Initial game state
  gameState: GameState = {
    ball: {
      x: 0,
      y: 0,
      directionX: 1,
      directionY: 0,
    },
    players: [
      { y: 0, socketId: 0 }, // Player 1
      { y: 0, socketId: 0 }, // Player 2
    ],
  };

  // clientSocket connections list
  clientSockets: Socket[] = [];

  handleConnection(clientSocket: Socket) {
    // When a new clientSocket connects, add them to the list of clientSockets
    this.clientSockets.push(clientSocket);
    console.log('clientSocket connected:', clientSocket.id);
    clientSocket.emit('assign-player', this.clientSockets.indexOf(clientSocket));

    // If we have two players, start the game
    if (this.clientSockets.length === 2) {
      this.startGame();
    }
  }

  handleDisconnect(clientSocket: Socket) {
    console.log('clientSocket disconnected:', clientSocket.id);

    // Remove disconnected clientSocket from the list of clientSockets
    this.clientSockets = this.clientSockets.filter((c) => c.id !== clientSocket.id);

    // Reset the game state
    this.gameState = {
      ball: {
        x: 400,
        y: 300,
        directionX: 1,
        directionY: 0,
      },
      players: [
        { y: 300, socketId: 0 }, // Player 1
        { y: 300, socketId: 0 }, // Player 2
      ],
    };
  }

  // Method to start the game
  startGame() {
    // Place the ball in the middle
    // this.gameState.ball.x = 400;
    // this.gameState.ball.y = 300;

    // // Place the players in initial positions
    // this.gameState.players[0].y = 300;
    // this.gameState.players[1].y = 300;

    // Send game state to both clientSockets
    this.server.emit('update-game', this.gameState);
  }

  // Method to handle player move events
  @SubscribeMessage('player-move')
  handlePlayerMove(clientSocket: Socket, payload: { y: number }) {
    //find playerIndex with clientSocket (this way, a player can only affect its paddle)
    let playerIndex: number = this.clientSockets.findIndex(cs => cs === clientSocket)
    // Update the player's position based on the payload
    this.gameState.players[playerIndex].y = payload.y;

    console.log(`Received player-move event of player ${playerIndex}, p1 pos:${this.gameState.players[0].y}, p2 pos:${this.gameState.players[1].y}, payload.y: ${payload.y}`)
    // Then emit the updated game state to both clientSockets
    this.server.emit('update-game', this.gameState);
  }
}
