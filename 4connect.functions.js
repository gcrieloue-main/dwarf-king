const players = {
  PLAYER_1: 1,
  PLAYER_2: 2,
};

module.exports = {
  getAvailableGame: function (games) {
    for (const [key, value] of games) {
      const game = games.get(key);
      if (!game.player1 || !game.player2) {
        return game;
      }
    }
    return null;
  },

  createNewGame: function () {
    const newGame = {
      board: [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
      ],
      colHeights: [0, 0, 0, 0, 0, 0, 0],
      player1: false,
      player2: false,
      currentPlayer: players.PLAYER_1,
      id: this.newUid(),
    };
    return newGame;
  },

  newUid: function () {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
      c
    ) {
      var r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  moveEnabled: (game, x) => x > 0 && x <= 7 && game.colHeights[x - 1] < 7,

  win: function (board) {
    return this.checkXAndYAxes(board) || this.checkDiagonals(board) || 0;
  },

  checkXAndYAxes: function (board) {
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
  },

  checkDiagonals: function (board) {
    var currentPlayerDiag1 = 0;
    var currentPlayerDiag2 = 0;
    var cumulDiag1 = 0;
    var cumulDiag2 = 0;
    for (var k = 0; k < 6; k++) {
      for (var l = 6; l >= 0; l--) {
        // check diag 1
        for (var i = k, j = l; i < 7 && j >= 0; i++, j--) {
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
        for (var i = k, j = l; i < 7 && j < 7; i++, j++) {
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
  },

  resetBoard: function (game) {
    game.board = [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ];
    game.colHeights = [0, 0, 0, 0, 0, 0, 0];
    game.currentPlayer = players.PLAYER_1;
    return game;
  },
};
