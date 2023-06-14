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

@WebSocketGateway(3000)
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
      { y: 0 }, // Player 1
      { y: 0 }, // Player 2
    ],
  };

  // Client connections list
  clients: Socket[] = [];

  handleConnection(client: Socket) {
    // When a new client connects, add them to the list of clients
    this.clients.push(client);
    console.log('Client connected:', client.id);

    // If we have two players, start the game
    if (this.clients.length === 2) {
      this.startGame();
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);

    // Remove disconnected client from the list of clients
    this.clients = this.clients.filter((c) => c.id !== client.id);

    // Reset the game state
    this.gameState = {
      ball: {
        x: 0,
        y: 0,
        directionX: 1,
        directionY: 0,
      },
      players: [
        { y: 0 }, // Player 1
        { y: 0 }, // Player 2
      ],
    };
  }

  // Method to start the game
  startGame() {
    // Place the ball in the middle
    this.gameState.ball.x = 400;
    this.gameState.ball.y = 300;

    // Place the players in initial positions
    this.gameState.players[0].y = 300;
    this.gameState.players[1].y = 300;

    // Send game state to both clients
    this.server.emit('update-game', this.gameState);
  }

  // Method to handle player move events
  @SubscribeMessage('player-move')
  handlePlayerMove(client: Socket, payload: { playerIndex: number; y: number }) {
    // Update the player's position based on the payload
    this.gameState.players[payload.playerIndex].y = payload.y;

    // Then emit the updated game state to both clients
    this.server.emit('update-game', this.gameState);
  }
}
