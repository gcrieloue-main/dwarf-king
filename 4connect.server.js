var express = require("express");
var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var path = require("path");
var fn = require("./4connect.functions");

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
    ROOM: "room",
    NUMBER: "number",
    GAMEOVER: "gameover",
    BOARD: "board",
    STATUS: "status",
    FORBIDDEN: "forbidden",
  },
};

const games = new Map();

io.on(events.IN.CONNECTION, (socket) => {
  game = fn.getAvailableGame(games);
  if (!game) {
    game = fn.createNewGame();
    games.set(game.id, game);
  }
  socket.game = game;
  socket.join(game.id);
  socket.emit(events.OUT.ROOM, game.id);

  if (!socket.game.player1) {
    socket.game.player1 = true;
    socket.player = players.PLAYER_1;
  } else if (!socket.game.player2) {
    socket.game.player2 = true;
    socket.player = players.PLAYER_2;
  }

  console.log(
    game.id,
    "player ",
    socket.player,
    " joined room",
    socket.game.player1,
    socket.game.player2
  );

  socket.emit(events.OUT.NUMBER, socket.player);

  if (socket.game.player1 && socket.game.player2) {
    console.log(socket.game.id, "ready");

    fn.resetBoard(socket.game);
    console.log(game.id, "emit board", game.board, game.currentPlayer);
    io.in(game.id).emit(events.OUT.BOARD, {
      board: game.board,
      player: game.currentPlayer,
    });

    io.in(game.id).emit(events.OUT.STATUS, "ready");
    console.log(socket.game.id, socket.game.board);
  }

  socket.on(events.IN.PLAY, function (x) {
    console.log(
      socket.game.id,
      "played on " + x + "=>" + socket.game.colHeights[x - 1]
    );

    if (
      socket.game.currentPlayer != socket.player ||
      !fn.moveEnabled(socket.game, x)
    ) {
      console.log(socket.game.id, "wrong move : " + x);
      socket.emit(events.OUT.FORBIDDEN, "wrong_move");
    } else {
      socket.game.board[x - 1][socket.game.colHeights[x - 1]] = socket.player;
      socket.game.colHeights[x - 1]++;
      socket.game.currentPlayer =
        socket.game.currentPlayer == players.PLAYER_1
          ? players.PLAYER_2
          : players.PLAYER_1;

      console.log(socket.game.board);
      io.in(socket.game.id).emit("board", {
        board: socket.game.board,
        player: socket.game.currentPlayer,
        move: x,
      });
    }

    var winner = fn.win(socket.game.board);
    if (winner) {
      io.in(socket.game.id).emit(events.OUT.GAMEOVER, winner);
      console.log(socket.game.id, "player " + winner + " won !");
    }
  });

  socket.on(events.IN.RESTART, function () {
    fn.resetBoard(socket.game);
    io.in(socket.game.id).emit(events.OUT.BOARD, {
      board: socket.game.board,
      player: socket.game.currentPlayer,
    });
  });

  socket.on(events.IN.DISCONNECT, function () {
    console.log(socket.game.id, "player " + socket.player + " disconnected");
    if (socket.player) {
      if (socket.player == players.PLAYER_1) {
        socket.game.player1 = false;
      } else if (socket.player == players.PLAYER_2) {
        socket.game.player2 = false;
      }

      if (!socket.game.player1 && !socket.game.player2) {
        console.log(socket.game.id, "end session");
        games.delete(socket.game.id);
      } else {
        fn.resetBoard(socket.game);
        console.log(socket.game.id, "not-ready");
        io.in(game.id).emit(events.OUT.STATUS, "not-ready");
      }
    }
  });
});

let port = process.env.PORT || 8080;
http.listen(port, function () {
  console.log("4connect listening on *:" + port);
});
