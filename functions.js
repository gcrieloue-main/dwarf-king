import { createQuests } from './quests.js'
import { colors, symbols, players } from './constants.js'

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
        if (game.nbPlayers < players.NB) {
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
        turnNumber: 0,
        id: newUid(),
    }
}

export function shuffle(array = []) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i)
        const temp = array[i]
        array[i] = array[j]
        array[j] = temp
    }
}

export function dealCards(nbPlayers) {
    let cards = []
    for (const color in colors) {
        for (const symbol in symbols) {
            cards.push(createNewCard(symbol, color))
        }
    }
    if (nbPlayers < 4) {
        cards = cards.filter(
            (c) => c.symbol !== symbols.TWO && c.color !== colors.GREEN
        )
    }
    shuffle(cards)
    cards.splice(8, cards.length) // for debug
    return splitToChunks(cards, nbPlayers).map((cardsGroup) =>
        cardsGroup.sort(
            (c1, c2) =>
                c1.color.localeCompare(c2.color) ||
                symbolToValue(c1.symbol) - symbolToValue(c2.symbol)
        )
    )
}

export function splitToChunks(array, parts) {
    const [...arr] = array
    let result = []
    for (let i = parts; i > 0; i--) {
        result.push(arr.splice(0, Math.ceil(arr.length / i)))
    }
    return result
}

export function newUid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
            var r = (Math.random() * 16) | 0,
                v = c === 'x' ? r : (r & 0x3) | 0x8
            return v.toString(16)
        }
    )
}

export function filterByColor(c, color) {
    return (c || [])
        .flat()
        .filter((card) => card.color.toUpperCase() === color.toUpperCase())
}
