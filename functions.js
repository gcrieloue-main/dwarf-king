const players = {
    PLAYER_1: 1,
    PLAYER_2: 2,
    NB: 2,
};

const colors = {
    BLUE: "blue",
    RED: "red",
    GREEN: "green",
};

const symbols = {
    TWO: "TWO",
    THREE: "THREE",
    FOUR: "FOUR",
    FIVE: "FIVE",
    SIX: "SIX",
    SEVEN: "SEVEN",
    HEIGHT: "HEIGHT",
    NINE: "NINE",
    JACK: "JACK",
    QUEEN: "QUEEN",
    KING: "KING",
    ACE: "ACE",
};

module.exports = {
    symbolToValue: (symbol) => {
        switch (symbol) {
            case symbols.TWO:
                return 2;
            case symbols.THREE:
                return 3;
            case symbols.FOUR:
                return 4;
            case symbols.FIVE:
                return 5;
            case symbols.SIX:
                return 6;
            case symbols.SEVEN:
                return 7;
            case symbols.HEIGHT:
                return 8;
            case symbols.NINE:
                return 9;
            case symbols.JACK:
                return 12;
            case symbols.QUEEN:
                return 13;
            case symbols.KING:
                return 14;
            case symbols.ACE:
                return 15;

            default:
                return 0;
        }
    },

    isHead: (symbol) => this.symbolToValue(symbol) >= 12,

    getAvailableGame: function (games) {
        for (const [key] of games) {
            const game = games.get(key);
            if (game.nbPlayers < players.NB) {
                return game;
            }
        }
        return null;
    },

    createNewCard: function (
        symbol = symbols.TWO,
        color = colors.BLUE
    ) {
        return {
            symbol,
            color,
            value: this.symbolToValue(symbol)
        };
    },

    createNewRule: function (ruleName, ruleDesc, ruleFn) {
        return {
            ruleName,
            ruleDesc,
            ruleFn,
        };
    },

    createNewGame: function () {
        return {
            started: false,
            availableQuests: this.createQuests(),
            currentQuest: undefined,
            currentRule: undefined,
            currentColor: undefined,
            availableCards: [],
            playersCards: [],
            nbPlayers: 0,
            players: [],
            table: [],
            currentPlayer: players.PLAYER_1,
            turnNumber: 0,
            id: this.newUid(),
        };
    },


    shuffle(array = []) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * i);
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    },

    dealCards: function (nbPlayers) {
        let cards = [];
        for (const color in colors) {
            for (const symbol in symbols) {
                cards.push(this.createNewCard(symbol, color));
            }
        }
        if (nbPlayers < 4) {
            cards = cards.filter(c => c.symbol !== symbols.TWO && c.color !== colors.GREEN);
        }
        this.shuffle(cards);
        // cards.splice(8, cards.length); // for debug
        return this.splitToChunks(cards, nbPlayers).map(cardsGroup =>
            cardsGroup.sort((c1, c2) =>
                c1.color.localeCompare(c2.color) ||
                this.symbolToValue(c1.symbol) - this.symbolToValue(c2.symbol)
            )
        );
    },

    splitToChunks: function (array, parts) {
        const [...arr] = array;
        let result = [];
        for (let i = parts; i > 0; i--) {
            result.push(arr.splice(0, Math.ceil(arr.length / i)));
        }
        return result;
    },

    newUid: () => {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
            c
        ) {
            var r = (Math.random() * 16) | 0,
                v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },

    createQuests: function () {
        return [
            [
                this.createNewRule("De trois quart", "+4 for 3 and 4", (playerCards) =>
                    playerCards.map(
                        (c) =>
                            (c.folds || []).flat().filter(
                                (card) =>
                                    card.symbol === symbols.THREE || card.symbol === symbols.FOUR
                            ).length * 4
                    )
                ),
                this.createNewRule("De six à sept quart", "+4 for 6 and 7", (playerCards) =>
                    playerCards.map(
                        (c) =>
                            (c.folds || []).flat().filter(
                                (card) =>
                                    card.symbol === symbols.SIX || card.symbol === symbols.SEVEN
                            ).length * 4
                    )
                )
            ],
            [
                this.createNewRule(
                    "Dernier carré",
                    "+4 pour exactement 4 plis",
                    (playerCards) =>
                        playerCards.map((c) => c.folds && c.folds.length === 4 ? 4 : 0)
                ),
                this.createNewRule(
                    "Demi carré",
                    "+4 pour exactement 2 plis",
                    (playerCards) =>
                        playerCards.map((c) => c.folds && c.folds.length === 2 ? 4 : 0)
                )
            ],
            [
                this.createNewRule(
                    "Victoire des chevaliers sur les nains",
                    "+1 par chevalier, -1 par nain",
                    (playerCards) => playerCards.map(
                        (c) =>
                            (c.folds || []).flat().filter(
                                (card) =>
                                    card.color === colors.BLUE
                            ).length
                            -
                            (c.folds || []).flat().filter(
                                (card) =>
                                    card.color === colors.GREEN
                            ).length
                    )
                ),
                this.createNewRule(
                    "Victoire des nains sur les chevaliers",
                    "+1 par nain, -1 par chevalier",
                    (playerCards) => playerCards.map(
                        (c) =>
                            (c.folds || []).flat().filter(
                                (card) =>
                                    card.color === colors.GREEN
                            ).length
                            -
                            (c.folds || []).flat().filter(
                                (card) =>
                                    card.color === colors.BLUE
                            ).length
                    )
                )
            ],
            [
                this.createNewRule(
                    "Armée d'élite",
                    "Autant de point que le nombre de carte dans la couleur où vous en avez le moins",
                    (playerCards) => playerCards.map(
                        (c) => {
                            const cardsPerColors = (c.folds || []).flat()
                                // tri par couleur
                                .sort((c1, c2) => c1.color.localeCompare(c2.color))
                                // découpage avec un tableau par couleur
                                .reduce((output, card) => {
                                    if (output.length === 0) output.push([card]);
                                    else if (output[output.length - 1][0].color === card.color) output[output.length - 1].push(card);
                                    else output.push([card]);
                                    return output;
                                }, [])

                            console.log('cardsPerColors', cardsPerColors);

                            return Math.min(cardsPerColors.map(cards => cards.length))
                        }
                    )
                ),
                this.createNewRule(
                    "Armée de masse",
                    "Autant de point que le nombre de carte dans la couleur où vous en avez le plus",
                    (playerCards) => playerCards.map(
                        (c) => {
                            const cardsPerColors = (c.folds || []).flat()
                                // tri par couleur
                                .sort((c1, c2) => c1.color.localeCompare(c2.color))
                                // découpage avec un tableau par couleur
                                .reduce((output, card) => {
                                    if (output.length === 0) output.push([card]);
                                    else if (output[output.length - 1][0].color === card.color) output[output.length - 1].push(card);
                                    else output.push([card]);
                                    return output;
                                }, [])

                            console.log('cardsPerColors', cardsPerColors);

                            return Math.max(cardsPerColors.map(cards => cards.length))
                        }
                    )
                )
            ]
        ];
    },
};
