var express = require("express");
var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var path = require("path");

app.get("/", function (req, res) {
  res.sendFile(path.resolve(__dirname, ".") + "/4connect.html");
});

app.use(express.static(path.resolve(__dirname, ".")));

const players = {
  PLAYER_1: 1,
  PLAYER_2: 2,
};

const events = {
  IN: {
    CONNECTION: "connection",
    DISCONNECT: "disconnect",
    RESTART: "restart",
    PLAY: "play",
  },
  OUT: {
    NUMBER: "number",
    GAMEOVER: "gameover",
    BOARD: "board",
    STATUS: "status",
    FORBIDDEN: "forbidden",
  },
};

var board = [];
var colHeights = [];
var player1 = false;
var player2 = false;
var currentPlayer = players.PLAYER_1;

io.on(events.IN.CONNECTION, (socket) => {
  if (!player1) {
    player1 = true;
    socket.player = players.PLAYER_1;
  } else if (!player2) {
    player2 = true;
    socket.player = players.PLAYER_2;
  } else {
    socket.emit(events.OUT.FORBIDDEN, "no_place_available");
    return;
  }

  console.log("player " + socket.player + " logged in.");
  socket.emit(events.OUT.NUMBER, socket.player);

  if (player1 && player2) {
    console.log("ready");
    resetBoard();
    io.emit(events.OUT.STATUS, "ready");
    console.log(board);
  }

  socket.on(events.IN.PLAY, function (x) {
    console.log("played on " + x + "=>" + colHeights[x - 1]);
    if (currentPlayer != socket.player || !moveEnabled(x)) {
      console.log("wrong move : " + x);
      socket.emit(events.OUT.FORBIDDEN, "wrong_move");
    } else {
      board[x - 1][colHeights[x - 1]] = socket.player;
      colHeights[x - 1]++;
      currentPlayer =
        currentPlayer == players.PLAYER_1 ? players.PLAYER_2 : players.PLAYER_1;
      console.log(board);
      io.emit("board", { board: board, player: currentPlayer });
    }

    var winner = win();
    if (winner) {
      io.emit(events.OUT.GAMEOVER, winner);
      console.log("player " + winner + " won !");
    }
  });

  socket.on(events.IN.RESTART, function () {
    resetBoard();
  });

  socket.on(events.IN.DISCONNECT, function () {
    console.log("player " + socket.player + " disconnected");
    if (socket.player) {
      if (socket.player == players.PLAYER_1) {
        player1 = false;
      } else if (socket.player == players.PLAYER_2) {
        player2 = false;
      }
      resetBoard();
      io.emit(events.OUT.STATUS, "not-ready");
    }
  });
});

function resetBoard() {
  board = [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ];
  colHeights = [0, 0, 0, 0, 0, 0, 0];
  currentPlayer = players.PLAYER_1;
  console.log("board reset");
  io.emit(events.OUT.BOARD, { board: board, player: currentPlayer });
}

moveEnabled = (x) => x > 0 && x <= 7 && colHeights[x - 1] < 7;

function win() {
  return checkXAndYAxes() || checkDiagonals() || 0;
}

function checkXAndYAxes() {
  var currentPlayerHori = 0;
  var currentPlayerVerti = 0;
  var cumulVerti = 0;
  var cumulHori = 0;
  for (var i = 0; i < 7; i++) {
    for (var j = 0; j < 7; j++) {
      // check columns
      if (board[i][j] != currentPlayerVerti) {
        cumulVerti = 0;
        currentPlayerVerti = board[i][j];
      }
      if (currentPlayerVerti != 0) {
        cumulVerti++;
        if (cumulVerti == 4) {
          return currentPlayerVerti;
        }
      }

      // check lines
      if (board[j][i] != currentPlayerHori) {
        cumulHori = 0;
        currentPlayerHori = board[j][i];
      }
      if (currentPlayerHori != 0) {
        cumulHori++;
        if (cumulHori == 4) {
          return currentPlayerHori;
        }
      }
    }
    cumulHoriz = 0;
    comulVerti = 0;
    currentPlayerVerti = 0;
    currentPlayerHori = 0;
  }
}

function checkDiagonals() {
  var currentPlayerDiag1 = 0;
  var currentPlayerDiag2 = 0;
  var cumulDiag1 = 0;
  var cumulDiag2 = 0;
  for (var k = 0; k < 6; k++) {
    for (var l = 6; l >= 0; l--) {
      // check diag 1
      for (var i = k, j = l; i < 6 && j >= 0; i++, j--) {
        if (board[i][j] != currentPlayerDiag1) {
          cumulDiag1 = 0;
          currentPlayerDiag1 = board[i][j];
        }
        if (currentPlayerDiag1 != 0) {
          cumulDiag1++;
          if (cumulDiag1 == 4) {
            return currentPlayerDiag1;
          }
        }
      }
      //check diag 2
      for (var i = k, j = l; i < 6 && j < 6; i++, j++) {
        if (board[i][j] != currentPlayerDiag2) {
          cumulDiag2 = 0;
          currentPlayerDiag2 = board[i][j];
        }
        if (currentPlayerDiag2 != 0) {
          cumulDiag2++;
          if (cumulDiag2 == 4) {
            return currentPlayerDiag2;
          }
        }
      }
      cumulDiag1 = 0;
      comulDiag2 = 0;
      currentPlayerDiag1 = 0;
      currentPlayerDiag2 = 0;
    }
  }
}

let port = process.argv[2] || 3006;
http.listen(port, function () {
  console.log("4connect listening on *:" + port);
});
