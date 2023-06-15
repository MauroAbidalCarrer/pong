import React, { useEffect, useState } from 'react';
import { ReactP5Wrapper } from "@p5-wrapper/react";
import io from 'socket.io-client'; // Import the socket.io client

export default function PongGame() { 
    const [socket, setSocket] = useState(null); // Store the socket connection
    const [connectionStatus, setConnectionStatus] = useState('Connecting...'); // Store connection status
    const [playerIndex, setPlayerIndex] = useState(null); // Store the player index, 0 = left, 1 = right

    // Connect to the socket server on component mount
    useEffect(() => {
        const newSocket = io.connect('http://localhost:8080'); // Replace with your server address

        newSocket.on('connect', () => setConnectionStatus('Connected'));
        newSocket.on('connect_error', () => setConnectionStatus('Connection failed'));
        newSocket.on('connect_timeout', () => setConnectionStatus('Connection timeout'));
        newSocket.on('assign-player', (playerIndex) => setPlayerIndex(playerIndex));

        setSocket(newSocket);
        return () => newSocket.close(); // Disconnect on unmount
    }, []);

    const sketch = p5 => {
        const canvasWidth = 800;
        const canvasHeight = 600;
        const playerWidth = 30;
        const playerOffset = 10;
        const playerHeight = 100;
        const ballRadius = 15;

        let playerLeft;
        let playerRight;
        let ball;

        // function clamp(num, min, max){
        // return Math.max(Math.min(num, max), min)
        // }
        class Player{
            constructor(x)
            {
                this.pos = p5.createVector(x, canvasHeight / 2)
                this.points = 0
                console.log('Player constructed')
            }
            
            draw(isLocal)
            {
                p5.rectMode(p5.CENTER)
                p5.fill(isLocal ? 'blue' : 'red')
                p5.rect(this.pos.x, this.pos.y, playerWidth, playerHeight)
                p5.rectMode(p5.CORNER)
            }
            move(upKey, downKey)
            {
                //get the direction
                let direction = 0
                if (p5.keyIsDown(upKey))
                    direction = -1
                if (p5.keyIsDown(downKey))
                    direction = 1
                //move
                this.pos.y += direction * canvasHeight * 0.5 * (p5.deltaTime / 1000)
                //clamp the position
                this.pos.y = Math.max(this.pos.y, playerHeight / 2)
                this.pos.y = Math.min(this.pos.y, canvasHeight - playerHeight / 2)
                // console.log(`Emitting "player-move" event, y: ${this.pos.y}`)
                socket.emit('player-move', { y: this.pos.y });
            }
        }

        class Ball{
            constructor()
            {
                this.pos = p5.createVector(canvasWidth / 2, canvasHeight / 2)
                //left(1) or right(2)
                // this.horizontalMovement = 1
                // this.verticalMovement = 0
            }
            draw()
            {
                // console.log(this.pos)
                p5.circle(this.pos.x, this.pos.y, ballRadius * 2)
            }
            // checkOverlap(player) {
            //     // Find the closest point to the circle within the rectangle
            //     let closestX = clamp(this.pos.x - player.pos.x,-playerWidth / 2, playerWidth / 2) + player.pos.x
            //     let closestY = clamp(this.pos.y - player.pos.y, -playerHeight / 2, playerHeight / 2) + player.pos.y
            //     // Calculate the distance between the circle's center and the closest point
            //     var distanceX = this.pos.x - closestX;
            //     var distanceY = this.pos.y - closestY;
            //     var distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
            //     // Check if the distance is less than the circle's radius squared
            //     return distanceSquared <= (ballRadius * ballRadius);
            // }
            // bounceOffPlayer(player) {
            //     let dir = p5.createVector(this.pos.x - player.pos.x, this.pos.y - player.pos.y);
            //     dir.normalize();
            //     this.horizontalMovement *= -1;
            //     this.verticalMovement = dir.y * 90;
            // }            
            // givepointToPlayer(player){
            //     this.pos = p5.createVector(canvasWidth / 2, canvasHeight / 2)
            //     player.points++
            //     //console.log(player.points)
            // }
            // move() {
            //     this.pos.x += this.horizontalMovement * canvasWidth * (p5.deltaTime / 1000)
            //     this.pos.y += this.verticalMovement * (p5.deltaTime / 1000)
            //     //bounce off players
            //     if (this.checkOverlap(playerLeft) && this.horizontalMovement === -1)
            //     this.bounceOffPlayer(playerLeft)
            //     if (this.checkOverlap(playerRight) && this.horizontalMovement === 1)
            //     this.bounceOffPlayer(playerRight)
            //     //bounce off walls
            //     if (this.pos.y > canvasHeight - ballRadius || this.pos.y < ballRadius){
            //     this.verticalMovement *= -1
            //     }
            //     if (this.pos.x > canvasWidth - ballRadius)
            //     this.givepointToPlayer(playerLeft)
            //     if (this.pos.x < ballRadius)
            //     this.givepointToPlayer(playerRight)
            // }
        }

        p5.setup = () => {
            // Your setup code here.
            p5.createCanvas(canvasWidth, canvasHeight);
            playerLeft = new Player(playerOffset + playerWidth);
            playerRight = new Player(canvasWidth - playerOffset - playerWidth);
            ball = new Ball();
            // console.log('setup called')
            socket.on('update-game', (gameState) => {
                // console.log("received gameState, left player: ", gameState.players[0].y, ", right player: ", gameState.players[1].y)
                if (playerIndex === 1)
                    playerLeft.pos.y = gameState.players[0].y;
                if (playerIndex === 0)
                    playerRight.pos.y = gameState.players[1].y;
                ball.pos.x = gameState.ball.pos.x;
                ball.pos.y = gameState.ball.pos.y;
            });

            // When a point is scored, update the players' scores
            socket.on('score', (scores) => {
                playerLeft.points = scores.left;
                playerRight.points = scores.right;
            });
        };

        p5.draw = () => {
            p5.background(220);
            playerLeft.draw(playerIndex === 0);
            playerRight.draw(playerIndex === 1);
            ball.draw();

            if (playerIndex === 0)
                playerLeft.move(p5.UP_ARROW, p5.DOWN_ARROW);
            if (playerIndex === 1)
                playerRight.move(87, 83);
            // ball.move();
        };

    };

    return (
        connectionStatus === 'Connected'
            ? <ReactP5Wrapper sketch={sketch} />
            : <p>{connectionStatus}</p>
    );
}
