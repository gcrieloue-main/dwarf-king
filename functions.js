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
  HEIGHT: "HEIGTH",
  NINE: "NINE",
  VALET: "VALET",
  QUEEN: "QUEEN",
  KING: "KING",
  AS: "AS",
};

const cardStatus = {
  HAND: "HAND",
  FOLD: "FOLD",
  TABLE: "TABLE",
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
      case symbols.VALET:
        return 12;
      case symbols.QUEEN:
        return 13;
      case symbols.KING:
        return 14;
      case symbols.AS:
        return 15;

      default:
        return 0;
    }
  },

  getAvailableGame: function (games) {
    for (const [key, value] of games) {
      const game = games.get(key);
      if (game.nbPlayers < players.NB) {
        return game;
      }
    }
    return null;
  },

  createNewCard: function (
    symbol = symbols.TWO,
    color = colors.BLUE,
    status = status.HAND
  ) {
    return {
      symbol,
      color,
      status,
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
    const newGame = {
      availableQuests: [
        this.createNewRule("De trois quart", "+4 for 3 and 4", (playerCards) =>
          playerCards.map(
            (cards) =>
              cards.filter(
                (card) =>
                  card.symbol == symbols.THREE || card.symbol == symbols.FOUR
              ).length * 4
          )
        ),
        this.createNewRule(
          "Dernier carré",
          "+4 pour 4 exactement plis",
          (playerCards) =>
            playerCards.map(
              (cards) =>
                cards.filter(
                  (card) =>
                    card.symbol == symbols.THREE || card.symbol == symbols.FOUR
                ).length * 4
            )
        ),
      ],
      currentQuest: undefined,
      availabledCards: [],
      playersCards: [],
      nbPlayers: 0,
      players: [],
      currentPlayer: players.PLAYER_1,
      id: this.newUid(),
    };
    return newGame;
  },

  shuffle(array = []) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * i);
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  },

  dealCards: function () {
    cards = [];
    for (const color in colors) {
      for (const symbol in symbols) {
        cards.push(this.createNewCard(symbol, color, cardStatus.HAND));
      }
    }
    this.shuffle(cards);
    cards.splice(4, cards.length); // for debug
    return [
      cards
        .slice(0, cards.length / 2)
        .sort(
          (c1, c2) =>
            c1.color.localeCompare(c2.color) ||
            this.symbolToValue(c1.symbol) - this.symbolToValue(c2.symbol)
        ),
      cards
        .slice(cards.length / 2)
        .sort(
          (c1, c2) =>
            c1.color.localeCompare(c2.color) ||
            this.symbolToValue(c1.symbol) - this.symbolToValue(c2.symbol)
        ),
    ];
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
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
};
