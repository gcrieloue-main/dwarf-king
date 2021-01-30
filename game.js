import { createQuests } from './quests.js'
import { colors, symbols, players, gameConfig } from './constants.js'
import { newUid, shuffle, splitToChunks } from './utils.js'

export function symbolToValue(symbol) {
    switch (symbol) {
        case symbols.TWO:
            return 2
        case symbols.THREE:
            return 3
        case symbols.FOUR:
            return 4
        case symbols.FIVE:
            return 5
        case symbols.SIX:
            return 6
        case symbols.SEVEN:
            return 7
        case symbols.HEIGHT:
            return 8
        case symbols.NINE:
            return 9
        case symbols.TEN:
            return 10
        case symbols.JACK:
            return 12
        case symbols.QUEEN:
            return 13
        case symbols.KING:
            return 14
        case symbols.ACE:
            return 15

        default:
            return 0
    }
}

export function isHead(symbol) {
    return symbolToValue(symbol) >= 12
}

export function getAvailableGame(games) {
    for (const [key] of games) {
        const game = games.get(key)
        if (game.nbPlayers < gameConfig.NB_PLAYERS) {
            return game
        }
    }
    return null
}

export function createNewCard(symbol = symbols.TWO, color = colors.BLUE) {
    return {
        symbol,
        color,
        value: symbolToValue(symbol),
    }
}

export function createNewRule(ruleName, ruleDesc, ruleFn) {
    return {
        ruleName,
        ruleDesc,
        ruleFn,
    }
}

export function createNewGame() {
    return {
        started: false,
        availableQuests: createQuests(),
        currentQuest: undefined,
        currentRule: undefined,
        currentColor: undefined,
        availableCards: [],
        playersCards: [],
        // total number of players
        nbPlayers: 0,
        players: [],
        // what is currently on the table
        table: [],
        // current player number
        currentPlayer: players.PLAYER_1,
        // first player for the current round
        firstPlayer: undefined,
        turnNumber: 0,
        id: newUid(),
    }
}

export function registerPlayer(game) {
    let firstPos = game.players.findIndex((pos) => !pos)
    if (firstPos !== -1) {
        game.players[firstPos] = true
    } else {
        game.players.push(true)
        firstPos = game.players.length - 1
    }

    game.nbPlayers++

    return firstPos + 1
}

export function playCard(game, player, cardPlayed) {
    const playedCard = game.playersCards[player - 1].cards.find(
        (card) =>
            card.symbol === cardPlayed.symbol && card.color === cardPlayed.color
    )
    if (!playedCard) {
        console.error(
            'player',
            player,
            'tried to play a card which is not in its game !',
            game.playersCards[player - 1].cards
        )
        return
    }

    // add played card to the table
    game.table[player - 1] = cardPlayed

    // remove played card to the player cards
    game.playersCards[player - 1].cards = game.playersCards[
        player - 1
    ].cards.filter(
        (card) =>
            card.symbol !== cardPlayed.symbol || card.color !== cardPlayed.color
    )

    const nbPlayersWhichHavePlayed = game.table.filter(
        (card) => card !== undefined
    ).length
    if (nbPlayersWhichHavePlayed === 1) {
        game.currentColor = cardPlayed.color
    }
    const turnOver = nbPlayersWhichHavePlayed === game.nbPlayers

    // if turn is not over, it's next player's turn
    if (!turnOver) {
        game.currentPlayer = (game.currentPlayer % game.nbPlayers) + 1
    }

    return turnOver
}

export function newRound(game) {
    game.turnNumber++
    game.currentRule = undefined
    game.currentQuest =
        game.availableQuests[
            Math.floor(Math.random() * game.availableQuests.length)
        ]
    game.currentColor = undefined

    // deal cards to players
    game.playersCards = dealCards(game.nbPlayers).map((c) => ({
        cards: c,
    }))

    if (
        game.playersCards.some(
            (playerCards) =>
                playerCards.cards.length !== game.playersCards[0].cards.length
        )
    ) {
        console.error(
            game.playersCards[0].cards.length,
            'vs',
            game.playersCards.filter(
                (playerCards) =>
                    playerCards.cards.length !==
                    game.playersCards[0].cards.length
            )[0].cards.length,
            'cards'
        )
        throw new Error('All players should have the same number of cards !')
    }
}

export function dealCards(nbPlayers) {
    let cards = []
    Object.values(colors).forEach((color) =>
        Object.values(symbols).forEach((symbol) =>
            cards.push(createNewCard(symbol, color))
        )
    )
    if (nbPlayers < 4) {
        cards = cards.filter(
            (card) => card.symbol !== symbols.TWO && card.color !== colors.GREEN
        )
    }
    shuffle(cards)
    console.log("number of cards", cards.length)
    // cards.splice(8, cards.length) // for debug
    return splitToChunks(cards, nbPlayers).map((cardsGroup) =>
        cardsGroup.sort(
            (card1, card2) =>
                card1.color.localeCompare(card2.color) ||
                symbolToValue(card1.symbol) - symbolToValue(card2.symbol)
        )
    )
}

export function filterByColor(cards, color) {
    return (cards || [])
        .flat()
        .filter((card) => card.color.toUpperCase() === color.toUpperCase())
}

export function computeRoundScore(game) {
    return game.currentRule.ruleFn(game.playersCards)
}

export function computeTotalScore(roundScore, game) {
    roundScore.map((rs, index) => rs + ((game.score && game.score[index]) || 0))
}
