var socket = io(),
  canvas = document.getElementById("boardCanvas"),
  ctx = canvas.getContext("2d"),
  config = {
    cellWidth: 40,
    canvasWidth: 280,
    canvasHeight: 360,
    strokeWidth: 1,
    get radius() {
      return this.cellWidth / 2 - this.strokeWidth;
    },
  },
  game = {
    player: 0,
    number: 0,
    gameover: false,
    currentBoard: undefined,
    currentPos: undefined,
  };

/*
 * websocket events
 */

socket.on("room", (room) => logEvent("room", room));

socket.on("forbidden", function (data) {
  logEvent("forbidden");
  if (data == "wrong_move") {
    $("#info").html("Vous ne pouvez pas jouer ici");
  } else if (data == "no_place_available") {
    $(".game").html("<h2>Désolé, le serveur est plein.</h2>");
  }
});

socket.on("status", function (state) {
  logEvent("status", state);
  if (state == "ready") {
    $("#boardCanvas").css("visibility", "visible");
  }
  if (state == "not-ready") {
    $("#boardCanvas").css("visibility", "hidden");
    $("#info").html("En attente de joueurs");
  }
});

socket.on("number", function (num) {
  logEvent("number", num);
  $("#playerNumber").html(num);
  game.number = num;
});

socket.on("gameover", function (num) {
  logEvent("gameover", num);
  $("#info").html("Le joueur " + num + " a gagné !");
  $("#info").effect("pulsate");
  game.gameover = true;
});

socket.on("board", function (data) {
  logEvent("board");
  game.currentBoard = data.board;
  game.player = data.player;
  if (data.player == game.number) {
    $("#info").html("A vous de jouer");
  } else {
    $("#info").html("Au tour de votre adversaire");
  }
  drawGame(ctx, game);
  game.gameover = false;
});

/*
 * canvas drawing
 */

function drawGame(ctx, game) {
  clearGame(ctx);
  drawPos(ctx, game.number, game.currentPos);
  drawLines(ctx);
  drawCoins(ctx, game.currentBoard);
}

function clearGame(ctx) {
  ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
  return ctx;
}

function drawPos(ctx, number, positionX) {
  ctx.beginPath();
  ctx.fillStyle = playerColor(number);
  ctx.arc(
    positionX,
    config.cellWidth / 2,
    config.radius,
    0,
    2 * Math.PI,
    false
  );
  ctx.fill();
  ctx.lineWidth = config.strokeWidth;
  ctx.strokeStyle = "#003300";
  ctx.stroke();
  return ctx;
}

function drawCoins(ctx, board) {
  if (board) {
    // draw coins
    [...Array(7).keys()].forEach((i) =>
      [...Array(7).keys()]
        .filter((j) => board[i][j] != 0)
        .forEach((j) => drawCoin(ctx, board[i][j], i, j))
    );
  }
  return ctx;
}

function drawCoin(ctx, player, x, y) {
  ctx.fillStyle = playerColor(player);
  ctx.beginPath();
  ctx.arc(
    x * config.cellWidth + config.cellWidth / 2,
    config.canvasHeight - y * config.cellWidth - config.cellWidth / 2,
    config.radius,
    0,
    2 * Math.PI,
    false
  );
  ctx.fill();
  ctx.lineWidth = config.strokeWidth;
  ctx.strokeStyle = "#003300";
  ctx.stroke();

  return ctx;
}

function drawLines(ctx) {
  // draw lines
  for (let i of [...Array(8).keys()]) {
    ctx.beginPath();
    ctx.moveTo(i * config.cellWidth, config.canvasHeight);
    ctx.lineTo(
      i * config.cellWidth,
      config.canvasHeight - 7 * config.cellWidth
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, config.canvasHeight - i * config.cellWidth);
    ctx.lineTo(config.canvasWidth, config.canvasHeight - i * config.cellWidth);
    ctx.stroke();
  }

  return ctx;
}

/*
 * webapp inputs
 */

$("#boardCanvas").mousemove(function (e) {
  var parentOffset = $(this).offset();

  var relX = e.pageX - parentOffset.left;

  if (isMyTurn(game)) {
    game.currentPos =
      Math.floor(relX / config.cellWidth) * config.cellWidth +
      config.cellWidth / 2;
    drawGame(ctx, game);
  }
});

$("#boardCanvas").click(function (e) {
  if (game.player == game.number && !game.gameover) {
    var parentOffset = $(this).offset();

    var relX = e.pageX - parentOffset.left;
    var position = Math.floor(relX / config.cellWidth) + 1;

    game.currentPos = undefined;
    drawGame(ctx, game);

    socket.emit("play", position);
    return false;
  }
});

/*
 * game logic
 */

isMyTurn = (game) => game.player == game.number && !game.gameover;

playerColor = (number) => (number == 1 ? "yellow" : (ctx.fillStyle = "red"));

/*
 * logs
 */

function logEvent(name, arg = "") {
  console.log(
    `%c  ${name} %c received %c ${arg}`,
    "background: MediumSeaGreen; color: white; font-weight: bold;",
    "background: MediumSeaGreen; color: #b2e6d5;",
    "color: MediumSeaGreen;"
  );
}
