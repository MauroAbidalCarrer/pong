import React, { useEffect, useState } from 'react';
import { ReactP5Wrapper } from "@p5-wrapper/react";
import io from 'socket.io-client'; // Import the socket.io client

export default function PongGame() { 
    //possible states: undefined(didn't try anything), in queue, Connection failed, Connection timeout, VICTORY, DEFEAT
    const [ sessionState, setsessionState ] = useState(undefined)
    const [socket, setSocket] = useState(null); // Store the socket connection
    // const [connectionStatus, setConnectionStatus] = useState('Connecting...'); // Store connection status
    const [playerIndex, setPlayerIndex] = useState(null); // Store the player index, 0 = left, 1 = right

    // Connect to the socket server on component mount
    useEffect(() => {
        const newSocket = io.connect('http://localhost:8080'); // Replace with your server address

        newSocket.on('connect', () => setsessionState('Connected'));
        newSocket.on('connect_error', () => setsessionState('Connection failed'));
        newSocket.on('connect_timeout', () => setsessionState('Connection timeout'));
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

        class Player{
            constructor(x)
            {
                this.pos = p5.createVector(x, canvasHeight / 2)
                this.points = 0
                this.won = false
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
                playerLeft.points = gameState.players[0].points
                playerRight.points = gameState.players[1].points
                playerRight.won = gameState.players[0].won
                playerLeft.won = gameState.players[1].won
            });

            // When a point is scored, update the players' scores
            socket.on('score', (scores) => {
                playerLeft.points = scores.left;
                playerRight.points = scores.right;
            });
        };

        function drawGame() {
            p5.background(220);
            playerLeft.draw(playerIndex === 0);
            playerRight.draw(playerIndex === 1);
            ball.draw();
 
            if (playerIndex === 0)
                playerLeft.move(p5.UP_ARROW, p5.DOWN_ARROW);
            if (playerIndex === 1)
                playerRight.move(87, 83);

            p5.textSize(32);
            p5.fill('black')
            p5.text(playerLeft.points.toString(), canvasWidth / 5, canvasHeight / 6)
            p5.text(playerRight.points.toString(), canvasWidth - canvasWidth / 5, canvasHeight / 6)
        }
        function drawEndMenu() {
            p5.clear()
            p5.textSize(150);
            if (sessionState === "VICTORY") {
                p5.fill('yellow')
                p5.text("VICTORY!", canvasWidth / 5, canvasHeight / 6)
            }
            else {
                p5.fill('gray')
                p5.text("DEFEAT!", canvasWidth / 10, canvasHeight / 10, canvasWidth * 0.9 , canvasHeight * 0.9)
            }
        }
        p5.draw = () => {
            if (sessionState !== undefined)
                drawEndMenu()
            else {
                if ((playerLeft.won && playerIndex === 0) || (playerRight.won && playerIndex === 1)) 
                    setsessionState("VICTORY")
                if ((playerLeft.won && playerIndex === 1) || (playerRight.won && playerIndex === 0)) 
                    setsessionState("DEFEAT")
                drawGame()
            }
        };

    };

    return (
        sessionState === 'Connected' || sessionState === "VICTORY" || sessionState === "DEFEAT"
            ? <ReactP5Wrapper sketch={sketch} />
            : <p>{connectionStatus}</p>
    );
}
