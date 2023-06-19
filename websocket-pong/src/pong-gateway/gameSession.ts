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
const interval: number = 1000 / 30
const canvasWidth = 800;
const canvasHeight = 600;
const playerWidth = 30;
const playerOffset = 10;
const playerHeight = 100;
const leftPlayerX = playerOffset + playerWidth
const rightPlayerX = canvasWidth - playerOffset - playerWidth
const ballRadius = 15;
const deltaTime: number = 1 / 30
const ballDeltaX = canvasWidth * deltaTime

// Define the GameState and Player type
type Player = {
  y: number
  points: number
};

type GameState = {
  nbFramesDebug: number
  ball: Ball
  players: [Player, Player];
};


class Ball{
  pos: Vector2D = new Vector2D(canvasWidth / 2, canvasHeight / 2)
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
    player.points++
  }
  move(gameState: GameState) {
    this.pos.x += this.horizontalMovement * ballDeltaX
    this.pos.y += this.verticalMovement * deltaTime
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
    if (this.pos.x > canvasWidth - ballRadius)
      this.givepointToPlayer(gameState.players[0])
    if (this.pos.x < ballRadius)
      this.givepointToPlayer(gameState.players[1]) 
  }
}

export class GameSession {

  // Initial game state
  gameState: GameState = {
    nbFramesDebug: 0,
    ball: new Ball(),
    players: [
      { y: canvasHeight / 2, points: 0 }, // Player 1
      { y: canvasHeight / 2, points: 0 }, // Player 2
    ],
  };

  // clientSocket connections list
  clientSockets: Socket[] = [];

  //Is used by the pongGateway to check if it should be removed
  gameIsOver: boolean = false
  debugId: number = -1

  constructor(clientSocket1: Socket, clientSocket2: Socket, debugId: number) {
    this.debugId = debugId
    this.clientSockets = [clientSocket1, clientSocket2]
    this.clientSockets.forEach((cs, index) => cs.emit('start-game', index))
    this.clientSockets.forEach(cs => cs.emit('update-game', this.gameState));
    this.clientSockets.forEach(cs => cs.on('disconnect', () => this.handleDisconnect(cs)))
    this.clientSockets.forEach(cs => cs.on('player-move', (payload) => this.handlePlayerMove(cs, payload)))
  }
 
  handleDisconnect(disconnectedClientSocket: Socket) {
    if (this.gameIsOver === false) {
      //find the index of the player that left
      let winnerSocket: Socket = this.clientSockets.find(cs => cs !== disconnectedClientSocket)
      //give the win to the player that remained
      console.log(`Game ${this.debugId} is over: a player left the game`)
      winnerSocket.emit('game-over', {won: true, reason: "Other player disconnected."})
      this.gameIsOver = true
    } 
  }
  update()  {
    this.gameState.ball.move(this.gameState)
    let WinnerIndex = this.gameState.players.findIndex(player => player.points >= 3)
    if (WinnerIndex !== -1) {
      console.log(`Game ${this.debugId} is over: player ${WinnerIndex} has ${this.gameState.players[WinnerIndex].points} points.`)
      this.clientSockets[WinnerIndex].emit('game-over', {won: true, reason: "You have 3 or more points."})
      this.clientSockets[1 - WinnerIndex].emit('game-over', {won: false, reason: "Other player has 3 or more points."})
      //Set gameIsOver to true before disconnecting the clients because handleDisconnect(which rellis on gameIsOver) will get called/
      this.gameIsOver = true
      this.clientSockets.forEach(cs => cs.disconnect(true))
    }
    else
      this.clientSockets.forEach(cs => cs.emit('update-game', this.gameState));
    this.gameState.nbFramesDebug++
  }

  // Method to handle player move events
  @SubscribeMessage('player-move')
  handlePlayerMove(clientSocket: Socket, payload: { y: number }) {
    //find playerIndex with clientSocket (this way, a player can only affect its paddle)
    let playerIndex: number = this.clientSockets.findIndex(cs => cs === clientSocket)
    // Update the player's position based on the payload
    this.gameState.players[playerIndex].y = payload.y;
  }
}
