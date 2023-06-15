import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { clamp, Vector2D } from './simpleMath';

//const
const canvasWidth = 800;
const canvasHeight = 600;
const playerWidth = 30;
const playerOffset = 10;
const playerHeight = 100;
const leftPlayerX = playerOffset + playerWidth
const rightPlayerX = canvasWidth - playerOffset - playerWidth
const ballRadius = 15;
const interval: number = 1000 / 30
const deltaTime: number = 1 / 30


// Define the GameState and Player type
type Player = {
  socketId: number
  y: number
  points: number
};

type GameState = {
  ball: Ball
  players: [Player, Player];
};


class Ball{
  pos: Vector2D = new Vector2D(0, 0)
  horizontalMovement: number = 1
  verticalMovement: number = 0
  checkOverlap(playerPos: Vector2D): boolean {
      // Find the closest point to the circle within the rectangle
      let closestX = clamp(this.pos.x - playerPos.x,-playerWidth / 2, playerWidth / 2) + playerPos.x
      let closestY = clamp(this.pos.y - playerPos.y, -playerHeight / 2, playerHeight / 2) + playerPos.y
      // Calculate the distance between the circle's center and the closest point
      var distanceX = this.pos.x - closestX;
      var distanceY = this.pos.y - closestY;
      var distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
      // Check if the distance is less than the circle's radius squared
      return distanceSquared <= (ballRadius * ballRadius);
  }
  bounceOffPlayer(playerPos: Vector2D) {
      let dir = new Vector2D(this.pos.x - playerPos.x, this.pos.y - playerPos.y);
      
      dir.normalize();
      this.horizontalMovement *= -1;
      this.verticalMovement = dir.y * 90;
  }            
  givepointToPlayer(player: Player){
    this.pos = new Vector2D(canvasWidth / 2, canvasHeight / 2)
    // console.log("ball pos reset: ", this.pos)
    player.points++
  }
  move(gameState: GameState) {
    // console.log("pos before moving: ", this.pos)
    this.pos.x += this.horizontalMovement * canvasWidth * deltaTime
    this.pos.y += this.verticalMovement * deltaTime
    // console.log("pos after moving: ", this.pos)
    //bounce off players
    let leftPlayerPos: Vector2D = new Vector2D(leftPlayerX, gameState.players[0].y)
    if (this.checkOverlap(leftPlayerPos) && this.horizontalMovement === -1)
      this.bounceOffPlayer(leftPlayerPos)
    let rightPlayerPos: Vector2D = new Vector2D(rightPlayerX, gameState.players[1].y)
    if (this.checkOverlap(rightPlayerPos) && this.horizontalMovement === 1)
      this.bounceOffPlayer(rightPlayerPos)
    //bounce off walls
    if (this.pos.y > canvasHeight - ballRadius || this.pos.y < ballRadius)
      this.verticalMovement *= -1
    if (this.pos.x > canvasWidth - ballRadius) {
      // console.log("giving point to left player.")
      this.givepointToPlayer(gameState.players[0])
    }
    if (this.pos.x < ballRadius) {
      // console.log("giving point to right player.")
      this.givepointToPlayer(gameState.players[1])
    }
    // console.log()
  }
}

@WebSocketGateway(8080)
export class PongGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Initial game state
  gameState: GameState = {
    ball: new Ball(),
    players: [
      { y: 0, socketId: 0, points: 0 }, // Player 1
      { y: 0, socketId: 0, points: 0 }, // Player 2
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
      ball: new Ball(),
      players: [
        { y: 300, socketId: 0, points: 0 }, // leftPlayer
        { y: 300, socketId: 0, points: 0 }, // rightPlayer
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
    //update
    setInterval(() => {
      this.gameState.ball.move(this.gameState)
      this.server.emit('update-game', this.gameState);
    }, interval);

  }

  // Method to handle player move events
  @SubscribeMessage('player-move')
  handlePlayerMove(clientSocket: Socket, payload: { y: number }) {
    //find playerIndex with clientSocket (this way, a player can only affect its paddle)
    let playerIndex: number = this.clientSockets.findIndex(cs => cs === clientSocket)
    // Update the player's position based on the payload
    this.gameState.players[playerIndex].y = payload.y;

    // console.log(`Received player-move event of player ${playerIndex}, p1 pos:${this.gameState.players[0].y}, p2 pos:${this.gameState.players[1].y}, payload.y: ${payload.y}`)
    // Then emit the updated game state to both clientSockets
    // this.server.emit('update-game', this.gameState);
  }
}
