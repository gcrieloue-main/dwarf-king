var express = require("express");
var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var path = require("path");
var fn = require("./functions");
const util = require("util");

app.get("/", function (req, res) {
  res.sendFile(path.resolve(__dirname, ".") + "/main.html");
});

app.use(express.static(path.resolve(__dirname, ".")));

const players = {
  PLAYER_1: 1,
  PLAYER_2: 2,
  NB: 2,
};

const cardStatus = {
  HAND: "HAND",
  FOLD: "FOLD",
  TABLE: "TABLE",
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
    TABLE: "table",
    FOLD: "fold",
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

  if (socket.game.nbPlayers < players.NB) {
    registerPlayer(socket);
  }

  console.log(
    game.id,
    "player ",
    socket.player,
    " joined room",
    socket.game.nbPlayers,
    "/",
    players.NB
  );

  socket.emit(events.OUT.NUMBER, socket.player);

  if (socket.game.nbPlayers == players.NB) {
    startGame(socket);
  }

  function registerPlayer(socket) {
    firstPos = socket.game.players.findIndex((pos) => !pos);
    if (firstPos != -1) {
      socket.game.players[firstPos] = true;
    } else {
      socket.game.players.push(true);
      firstPos = socket.game.players.length - 1;
    }
    socket.player = firstPos + 1;
    socket.game.nbPlayers++;
  }

  function startGame(socket) {
    console.log(socket.game.id, "ready");

    game.currentPlayer = 1;

    newRound(socket);

    io.in(game.id).emit(events.OUT.STATUS, {
      player: game.currentPlayer,
      status: "ready",
    });
  }

  function newRound(socket) {
    game.currentQuest = game.availableQuests[0];
    console.log("new round with quest ", game.currentQuest.ruleName);
    game.playersCards = fn.dealCards();

    sockets = io.sockets.sockets;
    for (var socketId in sockets) {
      sockets[socketId].emit(events.OUT.BOARD, {
        cards: game.playersCards[sockets[socketId].player - 1],
        player: socket.game.currentPlayer,
      });
    }
  }

  socket.on(events.IN.PLAY, function (cardPlayed) {
    if (socket.player != socket.game.currentPlayer) {
      console.log("it is player", socket.game.currentPlayer, "turn");
      return;
    }
    console.log(socket.game.id, socket.player, "played", cardPlayed);

    const playerCards = socket.game.playersCards[socket.player - 1];
    if (playerCards.find((card) => card.status == cardStatus.TABLE)) {
      console.log("already played");
    } else {
      card = playerCards.find(
        (card) =>
          card.symbol === cardPlayed.symbol && card.color == cardPlayed.color
      );
      if (card) {
        card.status = cardStatus.TABLE;
      } else {
        console.error("card not found", cardPlayed, "in", playerCards);
      }

      turnOver =
        socket.game.playersCards.filter(
          (cards) =>
            cards.filter((c) => c.status === cardStatus.TABLE).length > 0
        ).length === players.NB;

      if (!turnOver) {
        socket.game.currentPlayer =
          (socket.game.currentPlayer % game.nbPlayers) + 1;
      }

      console.log("next player", socket.game.currentPlayer);
      // annonce de la nouvelle carte déposée à tous les joueur
      io.in(game.id).emit(events.OUT.TABLE, {
        cards: socket.game.playersCards
          .map((cards) => cards.filter((c) => c.status === cardStatus.TABLE))
          .flat(),
        player: turnOver ? socket.game.currentPlayer : 0,
      });

      // tout le monde a joué
      if (turnOver) {
        // fin du tour, annonce du gagnant du pli à tout le monde
        endTableTurn(socket);
      }

      const roundOver =
        socket.game.playersCards.filter(
          (cards) =>
            cards.filter((card) => card.status == cardStatus.HAND).length > 0
        ).length === 0;
      if (roundOver) {
        console.log(
          "round is over",
          socket.game.currentQuest,
          socket.game.currentQuest.ruleFn(socket.game.playersCards)
        );

        setTimeout(() => newRound(socket), 2000);
      }
    }
  });

  function endTableTurn(socket) {
    hasWon = foldWinner(socket.game.playersCards, socket.game.currentPlayer);

    // on retire les cartes sur la table aux différents joueurs
    socket.game.playersCards = socket.game.playersCards.map(
      (cards) => (cards = cards.filter((c) => c.status !== cardStatus.TABLE))
    );

    socket.game.playersCards[hasWon.winner - 1].push(hasWon.cards);

    // on envoie à tous les joueurs leurs cartes
    sockets = io.sockets.sockets;
    for (var socketId in sockets) {
      sockets[socketId].emit(events.OUT.BOARD, {
        cards: game.playersCards[sockets[socketId].player - 1],
      });
    }

    socket.game.currentPlayer = hasWon.winner;
    // on envoie à tous les joueurs le gagnant du pli
    io.in(game.id).emit(events.OUT.FOLD, hasWon);
  }

  function foldWinner(allCards = [], currentPlayer) {
    tableCards = allCards
      .map((cards) => cards.filter((c) => c.status == cardStatus.TABLE))
      .flat();

    currentColor = tableCards[currentPlayer - 1].color;

    max = Math.max(
      ...tableCards
        .filter((c) => c.color == currentColor)
        .map((c) => fn.symbolToValue(c.symbol))
    );

    const winner =
      tableCards.findIndex(
        (c) => c.color == currentColor && fn.symbolToValue(c.symbol) == max
      ) + 1;

    return {
      winner: winner,
      cards: tableCards,
    };
  }

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
      socket.game.nbPlayers--;

      socket.game.players[socket.player - 1] = false;
      console.log("disconnect", socket.game.players);

      if (socket.game.nbPlayers === 0) {
        console.log(socket.game.id, "end session");
        games.delete(socket.game.id);
      } else {
        console.log(socket.game.id, "not-ready");
        io.in(game.id).emit(events.OUT.STATUS, "not-ready");
      }
    }
  });
});

let port = process.env.PORT || 8080;
http.listen(port, function () {
  console.log("listening on *:" + port);
});
