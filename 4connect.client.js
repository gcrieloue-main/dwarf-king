var player = 0;
var number = 0;
var socket = io();
var canvas = document.getElementById('boardCanvas');
var ctx = canvas.getContext('2d');
var cellWidth = 40;
var canvasWidth = 280;
var canvasHeight = 360;
var strokeWidth = 1;
var radius = cellWidth / 2 - strokeWidth;
var gameover = false;

// websocket events

socket.on('forbidden', function (data) {
    if (data == 'wrong_move') {
        $('#info').html('Vous ne pouvez pas jouer ici')
    }
    else if (data == 'no_place_available') {
        $('.game').html('<h2>Désolé, le serveur est plein.</h2>');
    }
});

socket.on('status', function (state) {
    console.log(state);
    if (state == 'ready') {
        $('#boardCanvas').css('visibility', 'visible');
    }
    if (state == 'not-ready') {
        $('#boardCanvas').css('visibility', 'hidden');
        $('#info').html("En attente de joueurs");
    }
});

socket.on('number', function (num) {
    $('#playerNumber').html(num);
    number = num;
});

socket.on('gameover', function (num) {
    $('#info').html('Le joueur ' + num + ' a gagné !');
    $('#info').effect('pulsate');
    gameover = true;
});

socket.on('board', function (data) {
    player = data.player;
    if (data.player == number) {
        $('#info').html("A vous de jouer");
    }
    else {
        $('#info').html("Au tour de votre adversaire");
    }
    drawBoard(data.board);
    gameover = false;
});

// canvas drawing

function drawBoard(board) {
    ctx.clearRect(0, cellWidth, canvasWidth, canvasHeight - cellWidth);

    drawLines(board);
    drawCoins(board);
}

function drawCoins(board) {
    // draw coins
    for (let i of [...Array(7).keys()]) {
        for (let j of [...Array(7).keys()]) {
            if (board[i][j] != 0) {
                if (board[i][j] == 1) {
                    ctx.fillStyle = "yellow";
                }
                else if (board[i][j] == 2) {
                    ctx.fillStyle = "red";
                }
                ctx.beginPath();
                ctx.arc(i * cellWidth + cellWidth / 2, (canvasHeight - j * cellWidth) - cellWidth / 2, radius, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.lineWidth = strokeWidth;
                ctx.strokeStyle = '#003300';
                ctx.stroke();
            }
        }
    }
}

function drawLines(board) {
    // draw lines
    for (let i of [...Array(8).keys()]) {
        ctx.beginPath();
        ctx.moveTo(i * cellWidth, canvasHeight);
        ctx.lineTo(i * cellWidth, canvasHeight - 7 * cellWidth);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, canvasHeight - i * cellWidth);
        ctx.lineTo(canvasWidth, canvasHeight - i * cellWidth);
        ctx.stroke();
    }
}

// webapp events

$("#boardCanvas").mousemove(function (e) {
    var parentOffset = $(this).offset();

    var relX = e.pageX - parentOffset.left;

    ctx.clearRect(0, 0, canvasWidth, cellWidth);

    if (player == number && !gameover) {

        ctx.beginPath();
        if (number == 1) {
            ctx.fillStyle = "yellow";
        }
        else if (number == 2) {
            ctx.fillStyle = "red";
        }

        var positionX = Math.floor(relX / cellWidth) * cellWidth + cellWidth / 2;
        ctx.arc(positionX, cellWidth / 2, radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = '#003300';
        ctx.stroke();
    }
});

$("#boardCanvas").click(function (e) {
    if (player == number && !gameover) {
        var parentOffset = $(this).offset();

        var relX = e.pageX - parentOffset.left;
        var position = Math.floor(relX / cellWidth) + 1;
        socket.emit('play', position);
        ctx.clearRect(0, 0, canvasWidth, cellWidth);
        return false;
    }
});