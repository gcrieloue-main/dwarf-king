const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const fn = require("./functions");
const util = require("util");

// app.get("/", function (req, res) {
//   res.sendFile(path.resolve(__dirname, ".") + "/main.html");
// });

app.use(express.static(path.resolve(__dirname, ".")));

const players = {
    PLAYER_1: 1,
    PLAYER_2: 2,
    NB: 2,
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
        SCORE: "score",
        QUEST: "quest",
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
    emitToPlayer(socket, events.OUT.ROOM, game.id);

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

    emitToPlayer(socket, events.OUT.NUMBER, socket.player);

    if (socket.game.nbPlayers === players.NB) {
        startGame(socket);
    }

    function registerPlayer(socket) {
        firstPos = socket.game.players.findIndex((pos) => !pos);
        if (firstPos !== -1) {
            socket.game.players[firstPos] = true;
        } else {
            socket.game.players.push(true);
            firstPos = socket.game.players.length - 1;
        }
        socket.player = firstPos + 1;
        socket.game.nbPlayers++;
    }

    function startGame(socket) {
        console.log("=============================================")
        console.log(socket.game.id, "ready");

        game.currentPlayer = 1;

        //reset score
        emitToAll(events.OUT.ROUND, {score: []})

        newRound(socket);

        emitToAll(game.id, events.OUT.STATUS, {
            player: game.currentPlayer,
            status: "ready",
        });
    }

    function newRound(socket) {
        console.log('new round')

        const randomQuest = game.availableQuests[Math.floor(Math.random() * game.availableQuests.length)];
        game.currentQuest = randomQuest;

        emitToAll(socket.game.id, events.OUT.QUEST, game.currentQuest);

        console.log("new round with quest ", `'${game.currentQuest.ruleName}'`);

        // deal cards to players
        game.playersCards = fn.dealCards().map(c => ({cards: c}));

        // send its cards to each player
        emitToEach(events.OUT.BOARD, s => ({
            ...game.playersCards[s.player - 1],
            player: socket.game.currentPlayer,
        }));

        emitToAll(socket.game.id, events.OUT.TABLE, {cards: [], player: socket.game.currentPlayer})
    }

    socket.on(events.IN.PLAY, function (cardPlayed) {
        if (socket.player !== socket.game.currentPlayer) {
            console.log("it is player", socket.game.currentPlayer, "turn");
            return;
        }
        console.log(socket.game.id, socket.player, "played", cardPlayed);

        // add played card to the table
        socket.game.table[socket.player - 1] = cardPlayed;

        // remove played card to the player cards
        socket.game.playersCards[socket.player - 1].cards =
            socket.game.playersCards[socket.player - 1].cards
                .filter(card => card.symbol !== cardPlayed.symbol || card.color !== cardPlayed.color);

        const turnOver = socket.game.table.length === players.NB && !socket.game.table.includes(undefined);

        // if turn is not over, it's next player's turn
        if (!turnOver) {
            socket.game.currentPlayer =
                (socket.game.currentPlayer % game.nbPlayers) + 1;
        }

        console.log("next player", socket.game.currentPlayer);

        // send remaining cards to the player
        emitToPlayer(socket, events.OUT.BOARD, {
            ...socket.game.playersCards[socket.player - 1],
            player: socket.game.currentPlayer
        });

        // tell everyone the cards on the table
        emitToAll(game.id, events.OUT.TABLE, {
            cards: socket.game.table,
            player: !turnOver ? socket.game.currentPlayer : 0,
        });

        // if everyone has played
        if (turnOver) {
            // compute who won the fold
            endTableTurn(socket);
        }

        // if turn is over, compute who won according to the current quest
        roundOver(socket);
    });

    function endTableTurn(socket) {
        console.log('end table turn')
        const hasWon = foldWinner(socket.game.table);

        // add fold to the winner folds
        socket.game.playersCards[hasWon.winner - 1].folds
            = [...(socket.game.playersCards[hasWon.winner - 1].folds || []), hasWon.cards];

        // send its cards to every player
        emitToEach(events.OUT.BOARD, s => ({
            ...game.playersCards[s.player - 1],
            player: s.game.currentPlayer
        }))

        socket.game.table = [];
        socket.game.currentPlayer = hasWon.winner;
        // on envoie à tous les joueurs le gagnant du pli
        emitToAll(game.id, events.OUT.FOLD, {
            winner: hasWon.winner,
            foldsNumbers: socket.game.playersCards.map(c => (c.folds && c.folds.length) || 0)
        });
    }

    function foldWinner(table) {
        if (table.length === 0) {
            throw new Error("nothing on the table");
        }

        const currentColor = table[0].color;

        const max = Math.max(
            ...table
                .filter((c) => c.color === currentColor)
                .map((c) => fn.symbolToValue(c.symbol))
        );

        const winner =
            table.findIndex(
                (c) => c.color === currentColor && fn.symbolToValue(c.symbol) === max
            ) + 1;

        return {
            winner: winner,
            cards: table,
        };
    }

    function roundOver(socket) {
        // round is over if noone has cards left to play
        const roundOver =
            socket.game.playersCards.filter((c) => c.cards.length > 0).length === 0;
        if (roundOver) {

            const roundScore = socket.game.currentQuest.ruleFn(socket.game.playersCards);
            console.log(
                "round is over",
                socket.game.currentQuest,
                JSON.stringify(socket.game.playersCards.map(c => c.folds), null, 2),
                roundScore
            );

            socket.game.score = roundScore.map((rs, index) => rs + ((socket.game.score && socket.game.score[index]) || 0));

            emitToAll(socket.game.id, events.OUT.SCORE, {score: socket.game.score});

            // start a new round
            setTimeout(() => newRound(socket), 2000);
        }
    }

    socket.on(events.IN.RESTART, function () {
        fn.resetBoard(socket.game);
        emitToAll(socket.game.id, events.OUT.BOARD, {
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
                emitToAll(game.id, events.OUT.STATUS, "not-ready");
            }
        }
    });

    /** Socket IO utils **/

    function emitToAll(gameId, eventName, data) {
        console.log("emit to all", gameId, eventName, data);
        io.in(gameId).emit(eventName, data);
    }

    function emitToPlayer(socket, eventName, data) {
        console.log("emit to player", socket.player, eventName, data);
        socket.emit(eventName, data);
    }

    function emitToEach(eventName, fn) {
        sockets = io.sockets.sockets;
        for (var socketId in sockets) {
            const data = fn(sockets[socketId])
            console.log("emit to player", sockets[socketId].player, eventName, data);
            sockets[socketId].emit(eventName, data);
        }
    }
});

const port = process.env.PORT || 4001;
server.listen(port, function () {
    console.log("listening on *:" + port);
});
