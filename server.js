import express from 'express'
import http from 'http'
import path from 'path'
import socketIo from 'socket.io'
import { dealCards, symbolToValue, createNewGame } from './functions.js'
import { specialLog, emitToAll, emitToPlayer, emitToEach } from './utils.js'

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

const modDev = true

if (!modDev) {
    app.use(express.static(path.join(__dirname, 'client/build')))
    app.get('/', function (req, res) {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'))
    })
}

const players = {
    PLAYER_1: 1,
    PLAYER_2: 2,
    MAX_PLAYERS: 5,
    MIN_PLAYERS: 2,
}

const events = {
    IN: {
        CONNECTION: 'connection',
        DISCONNECT: 'disconnect',
        RESTART: 'restart',
        PLAY: 'play',
        LIST: 'list',
        JOIN: 'join',
        START: 'start',
        CREATE: 'create',
        QUEST_SELECTED: 'questSelected',
    },
    OUT: {
        LIST: 'list',
        ROOM: 'room',
        NUMBER: 'number',
        GAMEOVER: 'gameover',
        BOARD: 'board',
        STATUS: 'status',
        FORBIDDEN: 'forbidden',
        TABLE: 'table',
        FOLD: 'fold',
        SCORE: 'score',
        QUEST: 'quest',
        QUEST_SELECTION: 'questSelection',
        ROUND: 'round',
        NB_PLAYERS: 'nbPlayers',
    },
}

const games = new Map()

io.on(events.IN.CONNECTION, (socket) => {
    socket.on(events.IN.LIST, function () {
        console.log('list games', Array.from(games.values()))
        socket.emit(events.OUT.LIST, Array.from(games.values()))
    })

    socket.on(events.IN.CREATE, function () {
        if (socket.game) {
            console.error('already in game', socket.game.id)
            return
        }

        const game = createNewGame()
        console.log('create game', game.id)
        games.set(game.id, game)

        joinGame(socket, game)

        console.log('list games', Array.from(games.values()))
        io.emit(events.OUT.LIST, Array.from(games.values()))
    })

    socket.on(events.IN.JOIN, function (gameId) {
        if (!games.has(gameId)) {
            console.error('game', gameId, 'does not exist')
            return
        }

        if (socket.game) {
            console.error('already in game', socket.game.id)
            return
        }

        console.log('joining game', gameId)
        joinGame(socket, games.get(gameId))
        io.emit(events.OUT.LIST, Array.from(games.values()))
    })

    socket.on(events.IN.START, function (gameId) {
        startGame(socket, games.get(gameId))
    })

    function joinGame(socket, game) {
        if (game.started) {
            console.error('game', game.id, 'has already started')
            return
        }

        if (game.nbPlayers > players.MAX_PLAYERS) {
            console.error('game', game.id, 'is full')
            return
        }

        socket.game = game
        socket.join(game.id)
        registerPlayer(socket)
        emitToPlayer(socket, events.OUT.ROOM, game.id)

        console.log(
            socket.game.id,
            'player ',
            socket.player,
            ' joined room',
            socket.game.nbPlayers,
            '/',
            players.MAX_PLAYERS
        )

        emitToPlayer(socket, events.OUT.NUMBER, socket.player)
    }

    function registerPlayer(socket) {
        let firstPos = socket.game.players.findIndex((pos) => !pos)
        if (firstPos !== -1) {
            socket.game.players[firstPos] = true
        } else {
            socket.game.players.push(true)
            firstPos = socket.game.players.length - 1
        }
        socket.player = firstPos + 1
        socket.game.nbPlayers++
    }

    function startGame(socket) {
        if (!socket.game) {
            console.error("can't start game", 'the game no longer exists')
            return
        }

        if (socket.game.started) {
            console.error('game', socket.game.id, 'already started')
            return
        }

        if (socket.game.nbPlayers < players.MIN_PLAYERS) {
            console.error(
                "can't start game ",
                socket.game.id,
                ', waiting for more players'
            )
            return
        }

        specialLog('start game')
        console.log(socket.game.id, 'ready')

        socket.game.currentPlayer = 1

        //reset score
        emitToAll(
            io,
            socket.game.id,
            events.OUT.NB_PLAYERS,
            socket.game.nbPlayers
        )
        emitToAll(io, socket.game.id, events.OUT.ROUND, { score: [] })
        emitToAll(io, socket.game.id, events.OUT.QUEST, undefined)

        newRound(socket)

        socket.game.started = true

        emitToAll(io, socket.game.id, events.OUT.STATUS, {
            player: socket.game.currentPlayer,
            status: 'ready',
        })
    }

    function newRound(socket) {
        specialLog('new round')
        socket.game.turnNumber++
        socket.game.currentRule = undefined
        socket.game.currentQuest =
            socket.game.availableQuests[
                Math.floor(Math.random() * socket.game.availableQuests.length)
            ]
        socket.game.currentColor = undefined

        // deal cards to players
        socket.game.playersCards = dealCards(socket.game.nbPlayers).map(
            (c) => ({
                cards: c,
            })
        )

        // send its cards to each player
        emitToEach(io, socket.game.id, events.OUT.BOARD, (s) => ({
            ...socket.game.playersCards[s.player - 1],
            player: socket.game.currentPlayer,
        }))

        emitToAll(io, socket.game.id, events.OUT.TABLE, {
            cards: [],
            currentColor: undefined,
            player: socket.game.currentPlayer,
        })
        emitToAll(io, socket.game.id, events.OUT.QUEST, undefined)
        emitToAll(
            io,
            socket.game.id,
            events.OUT.QUEST_SELECTION,
            socket.game.currentQuest
        )
    }

    socket.on(events.IN.QUEST_SELECTED, function (data) {
        if (socket.game.currentQuest) {
            socket.game.currentRule = socket.game.currentQuest[0]
            console.log('quest selected', data)
            emitToAll(
                io,
                socket.game.id,
                events.OUT.QUEST,
                socket.game.currentRule
            )
        } else {
            console.error('no quest !')
        }
    })

    socket.on(events.IN.PLAY, function (cardPlayed) {
        if (socket.player !== socket.game.currentPlayer) {
            console.error('it is player', socket.game.currentPlayer, 'turn !')
            return
        }

        if (!cardPlayed) {
            console.error(
                'player',
                socket.player,
                'tries to play an undefined card !'
            )
            return
        }

        specialLog('a player played')
        console.log(socket.game.id, socket.player, 'played', cardPlayed)

        const playedCard = socket.game.playersCards[
            socket.player - 1
        ].cards.find(
            (card) =>
                card.symbol === cardPlayed.symbol &&
                card.color === cardPlayed.color
        )
        if (!playedCard) {
            console.error(
                'player',
                socket.player,
                'tried to play a card which is not in its game !',
                socket.game.playersCards[socket.player - 1].cards
            )
            return
        }

        // add played card to the table
        socket.game.table[socket.player - 1] = cardPlayed

        // remove played card to the player cards
        socket.game.playersCards[
            socket.player - 1
        ].cards = socket.game.playersCards[socket.player - 1].cards.filter(
            (card) =>
                card.symbol !== cardPlayed.symbol ||
                card.color !== cardPlayed.color
        )

        const nbPlayersWhichHavePlayed = socket.game.table.filter(
            (card) => card !== undefined
        ).length
        if (nbPlayersWhichHavePlayed === 1) {
            socket.game.currentColor = cardPlayed.color
        }
        const turnOver = nbPlayersWhichHavePlayed === socket.game.nbPlayers

        // if turn is not over, it's next player's turn
        if (!turnOver) {
            socket.game.currentPlayer =
                (socket.game.currentPlayer % socket.game.nbPlayers) + 1
        }

        console.log('next player', socket.game.currentPlayer)

        // send remaining cards to the player
        emitToPlayer(socket, events.OUT.BOARD, {
            ...socket.game.playersCards[socket.player - 1],
            player: socket.game.currentPlayer,
        })

        // tell everyone the cards on the table
        emitToAll(io, socket.game.id, events.OUT.TABLE, {
            cards: socket.game.table,
            currentColor: socket.game.currentColor,
            player: !turnOver ? socket.game.currentPlayer : 0,
        })

        // if everyone has played
        if (turnOver) {
            // compute who won the fold
            endTableTurn(socket)
        }

        // if turn is over, compute who won according to the current quest
        roundOver(socket)
    })

    function endTableTurn(socket) {
        console.log('end of turn')
        const hasWon = foldWinner(socket.game.table)

        // add fold to the winner folds
        socket.game.playersCards[hasWon.winner - 1].folds = [
            ...(socket.game.playersCards[hasWon.winner - 1].folds || []),
            hasWon.cards,
        ]

        // send its cards to every player
        emitToEach(io, socket.game.id, events.OUT.BOARD, (s) => ({
            ...socket.game.playersCards[s.player - 1],
            player: s.game && s.game.currentPlayer,
        }))

        socket.game.table = []
        socket.game.currentPlayer = hasWon.winner
        // on envoie à tous les joueurs le gagnant du pli
        emitToAll(io, socket.game.id, events.OUT.FOLD, {
            winner: hasWon.winner,
            foldsNumbers: socket.game.playersCards.map(
                (c) => (c.folds && c.folds.length) || 0
            ),
        })
    }

    function foldWinner(table) {
        if (table.length === 0) {
            throw new Error('nothing on the table')
        }

        const currentColor = table[0].color

        const max = Math.max(
            ...table
                .filter((c) => c && c.color === currentColor)
                .map((c) => symbolToValue(c.symbol))
        )

        const winner =
            table.findIndex(
                (c) =>
                    c &&
                    c.color === currentColor &&
                    symbolToValue(c.symbol) === max
            ) + 1

        return {
            winner: winner,
            cards: table,
        }
    }

    function roundOver(socket) {
        // round is over if noone has cards left to play
        const roundOver =
            socket.game.playersCards.filter((c) => c.cards.length > 0)
                .length === 0
        if (roundOver) {
            specialLog('end of round ' + socket.game.turnNumber)

            const roundScore = socket.game.currentRule.ruleFn(
                socket.game.playersCards
            )
            console.log(
                'round is over',
                socket.game.currentRule,
                // JSON.stringify(socket.game.playersCards.map(c => c.folds), null, 2),
                roundScore
            )

            socket.game.score = roundScore.map(
                (rs, index) =>
                    rs + ((socket.game.score && socket.game.score[index]) || 0)
            )

            emitToAll(io, socket.game.id, events.OUT.SCORE, {
                roundScore: roundScore,
                roundRule: socket.game.currentRule,
                score: socket.game.score,
                folds: socket.game.playersCards.map((c) => c.folds),
            })

            if (socket.game.turnNumber === 7) {
                // game is over
                emitToAll(io, socket.game.id, events.OUT.GAMEOVER)
            } else {
                // start a new round
                setTimeout(() => newRound(socket), 2000)
            }
        }
    }

    socket.on(events.IN.RESTART, function () {
        emitToAll(io, socket.game.id, events.OUT.BOARD, {
            board: socket.game.board,
            player: socket.game.currentPlayer,
        })
    })

    socket.on(events.IN.DISCONNECT, function () {
        if (socket.game) {
            console.log(
                socket.game.id,
                'player ' + socket.player + ' disconnected'
            )
            console.log(socket.game.id, 'end session')
            emitToAll(io, socket.game.id, events.OUT.STATUS, {
                status: 'disconnected',
            })
            // unlink game from player's socket
            const allSockets = io.sockets.sockets
            io.of('/')
                .in(socket.game.id)
                .clients((_, roomSocketsIds) => {
                    roomSocketsIds.forEach((socketId) => {
                        const roomSocket = allSockets[socketId]
                        roomSocket.game = undefined
                        roomSocket.leave(socket.game.id)
                    })
                })
            // delete game
            games.delete(socket.game.id)
        }
    })
})

const port = +process.env.PORT || 8080
server.listen(port, function () {
    console.log('\n\n\n\n\n\n\n\n\n\n\n\n')
    console.log('listening on *:' + port)
})
