const socket = io('http://localhost:3000', { transports : ['websocket'] });

Math.lerp = function (X1, X2, Y1, Y2, X3) { return Number((X2 - X3) * Y1 + (X3 - X1) * Y2) / (X2 - X1);};

// LISTEN EVENTS
socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('forbiddenName', handleForbiddenName);
socket.on('roomDoesNotExist', handleRoomDoesNotExist);
socket.on('roomFull', handleRoomFull);



const BG_COLOUR = "#231f20";
const BULLET_COLOUR = "#c2c2c2";
const PLAYER_COLOUR = "#ff0000";
const COLLIDING_COLOUR = "#7CFC00";
const LIFEBARDIMENSION = 100;
const LIFEBARCORNERRADIUS = 30;


const nickname = document.getElementById('nickname');
const roomIdInput = document.getElementById('roomId');
const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const startGameButton = document.getElementById('startGameButton');
const joinGameButton = document.getElementById('joinGameButton');
const respawnButtom = document.getElementById('respawnBt');


const gameCodeDisplay = document.getElementById('gameCodeDisplay');

const joinGameObjs = document.getElementsByClassName('joinGame');
const startGameObjs = document.getElementsByClassName('startGame');
const respawnObjs = document.getElementsByClassName('respawn');
const xpBar = document.getElementById('xpBar');
const deathText = document.getElementById('death-text');


startGameButton.addEventListener('click', newGame);
joinGameButton.addEventListener('click', joinGame);
respawnButtom.addEventListener('click', respawn);



let canvas, ctx, hudCanvas, hudCtx;


let playerId;
let roomId;
let playerName;



function newGame() {
    playerName = nickname.value;

    if (playerName.length > 0 && playerName.length < 16) {
        selected =  document.querySelector('input[name="ship-selector"]:checked').value;

        socket.emit('newGame', {
            selected : selected, 
            playerName : playerName
        });
        
    } else{
        playerName.length == 0 ? null : alert('O Nickname deve ter no máximo 16 caracteres');
    }

}

function joinGame() {
    playerName = nickname.value;
    joinRoomId = roomIdInput.value;


    if (playerName.length > 0 && playerName.length < 16) {
        if (joinRoomId.length > 0 && joinRoomId.length == 5){
            selected =  document.querySelector('input[name="ship-selector"]:checked').value;
        
            socket.emit('joinGame', {
                roomId : joinRoomId, 
                selected: selected, 
                playerName : playerName
            });
        } else {
            joinRoomId.length == 0 ? null : alert('O Id da sala deve ter exatamente 5 caracteres');
            return;
        }
        
    } else{
        playerName.length == 0 ? null : alert('O Nickname deve ter no máximo 16 caracteres');
        return;
    }}



function start() {
    // HIDE SELECTION MENU AND SHOW GAME
    initialScreen.style.display = 'none';
    gameScreen.style.display = 'block';


    // CANVAS DRAW
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    canvas.width = 1500;
    canvas.height = 900;
    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    // ASSETS CREATE
    img_assets = {
        ship1 : new Image(),
        ship2 : new Image(),
        ship3 : new Image(),
    }
    // ASSETS LOAD
    img_assets.ship1.src = '../assets/img/ship1.png';
    img_assets.ship2.src = '../assets/img/ship2.png';
    img_assets.ship3.src = '../assets/img/ship3.png';

    // KEYBOARD LISTENER
    document.addEventListener('keydown', keyDown, false);
    document.addEventListener('keyup', keyUp, false);

}

// DRAW 
function drawScreen(state) {
    // GAME CANVAS
    ctx.fillStyle = BG_COLOUR;
    ctx.globalCompositeOperation = 'destination-under';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

}

function drawPlayer(players, color) {
    for (i in players) {
        playerState = players[i];

        if (playerState.playerId === playerId) {
            camera = {
                get x () { return -(canvas.width / 2 - playerState.pos.x) },
                get y () { return -(canvas.height / 2 - playerState.pos.y) }
            }
            ctx.strokeRect(-camera.x,0,canvas.width,canvas.height);
        }else
        {
            camera = {
                get x () { return 0 },
                get y () { return 0 }
            }
        }

        
        
        // Only for client local player
        // if (playerState.playerId === playerId) {
        //     ctx.fillStyle = "#ffffff";
        //     ctx.textAlign = "center";
        //     ctx.fillText(`${playerName}`, (playerState.pos.x + playerState.size.x/2) , playerState.pos.y - 20);
        // }



        size = playerState.size;
        ctx.fillStyle = color;

        ctx.save();

        //Draw player img
        ctx.translate((playerState.pos.x - camera.x) + size.x/2 , playerState.pos.y + size.y/2);
        ctx.rotate(playerState.angle * Math.PI / 180);
        ctx.translate(-((playerState.pos.x - camera.x) + playerState.size.x/2) , -(playerState.pos.y  + playerState.size.y/2));
        ctx.globalAlpha = playerState.life.indicator;
        ctx.drawImage(img_assets[playerState.shipStyle], (playerState.pos.x - camera.x), playerState.pos.y, size.x, size.y,);

        ctx.restore();

        //Draw players name
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "12px Arial";
        posYModifier = 20;
        posXModifier = 70;
        posY = (playerState.pos.y - 30) < posYModifier ? posYModifier : (playerState.pos.y - 30);
        nextPosX = (playerState.pos.x  - camera.x + playerState.size.x/2);
        posX = nextPosX < posXModifier ? posXModifier : nextPosX > canvas.width - posXModifier ? canvas.width - posXModifier : nextPosX;
        ctx.fillText(`-( ${playerState.level.current} )- ${playerState.playerName}`, posX , posY);
        // ctx.fillText(`Player Xp: ${playerState.level.exp.current} | ${playerState.level.exp.max}\n Total Earned: ${playerState.level.exp.totalEarned}`, posX, posY + 100,);
        // ctx.fillText(`Player Hp: ${playerState.life.health} | ${playerState.life.maxHealth}\n Damage: ${playerState.bullet.damage} | ${playerState.bullet.specialProperties.maxDamage} `, posX, posY + 100,);
        
        // ctx.fillRect(playerState.pos.x+size/2, playerState.pos.y+size/2, 15, 2); //CENTER OF OBJECT

        //Draw life bar
        ctx.save();
        
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.moveTo(posX - 50, posY + 10);
        line = Math.lerp(playerState.life.maxHealth,0,50,-50,playerState.life.health);
        if (line < -50) line = -50;

        ctx.lineTo(posX + line, posY + 10);
        ctx.stroke();
        ctx.restore();

        
    };
}

function drawXpBar(players){
    Object.keys(players).forEach(player => {
        playerState = players[player];

        if (playerState.playerId === playerId) {
            xpBar.value = playerState.level.exp.indicator;
        }
    });
}


function drawBullets(bullets, color, players) {

    for (i in bullets){
        bullet = bullets[i];

        if (playerId === bullet.origin) {
            b_camera = {
                get x () { return -(canvas.width / 2 - players[playerId].pos.x) },
                get y () { return -(canvas.height / 2 - players[playerId].pos.y) }
            }
        }else
        {
            b_camera = {
                get x () { return 0 },
                get y () { return 0 }
            }
        }

        ctx.fillStyle = color;
        ctx.save();
        ctx.translate((bullet.pos.x - b_camera.x) + bullet.size.x/2 , bullet.pos.y + bullet.size.y/2);
        ctx.rotate(bullet.angle * Math.PI / 180);
        ctx.translate(-((bullet.pos.x - b_camera.x) + bullet.size.x/2) , -(bullet.pos.y + bullet.size.y/2));
        ctx.globalAlpha = bullet.opacity;
        ctx.fillRect((bullet.pos.x - b_camera.x), bullet.pos.y, bullet.size.x, bullet.size.y);

        ctx.restore();
    };
}


// TO SERVER

function keyDown(command){
    // console.log(` > [keyDown]<Client> Tecla Pressionada: ${command.key} Código: ${command.keyCode}`);
    socket.emit('keyDown', {key : command.key, keyCode: command.keyCode});
}

function keyUp(command){
    // console.log(` > [keyUp] Tecla Levantada: ${command.key}`);
    socket.emit('keyUp', {key : command.key, keyCode: command.keyCode});
}

function handleInit(args) {
    start();
    console.log(` > [handleInit] Entrou na sala: ${args.roomId} com o id: ${args.playerId}`);
    playerId = args.playerId;
    roomId = args.roomId;
    gameCodeDisplay.innerText = `Room Id: ${roomId}`;

}

function handleForbiddenName(){
    alert('Nome inválido');
}

function handleRoomDoesNotExist(){
    alert('Sala não existe');
}

function handleRoomFull(){
    alert('Sala cheia');
}

function handleGameState(gameState) {
    gameState = JSON.parse(gameState);

    requestAnimationFrame(() => drawScreen(gameState)); 
    requestAnimationFrame(() => drawBullets(gameState.bullets, BULLET_COLOUR, gameState.players));
    requestAnimationFrame(() => drawPlayer(gameState.players, PLAYER_COLOUR));
    requestAnimationFrame(() => drawXpBar(gameState.players));


    // requestAnimationFrame(() => drawLifeBar(gameState.players));
    // requestAnimationFrame(() => drawPlayersCollision(gameState.players));
    
}

function respawn(args){
    // TODO - respawn player
    for (var i = 0; i < respawnObjs.length; i++) {
        respawnObjs[i].style.display = 'none';
    }

    selected =  document.querySelector('input[name="ship-selector-respawn"]:checked').value;

    socket.emit('respawn', {
        roomId : roomId, 
        selected: selected, 
        playerName : playerName
    });

}

function handleGameOver(args) {
    args = JSON.parse(args);

    if (args.id == playerId) {
        deathText.innerText = 'The end...';
        for (var i = 0; i < respawnObjs.length; i++) {
            respawnObjs[i].style.display = 'block';
        }
    }
}

function insertRoom(){
    
    roomIdInput.required = true;

    for (var i = 0; i < startGameObjs.length; i++) {
        startGameObjs[i].style.display = 'none';
    }


    for (var i = 0; i < joinGameObjs.length; i++) {
        joinGameObjs[i].style.display = 'block';
    }

}

function goBack() {
    roomIdInput.required = false;
        
    for (var i = 0; i < startGameObjs.length; i++) {
        startGameObjs[i].style.display = 'block';
    }

    for (var i = 0; i < joinGameObjs.length; i++) {
        joinGameObjs[i].style.display = 'none';
    }
}

