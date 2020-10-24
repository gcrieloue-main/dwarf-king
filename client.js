var socket = io(),
  config = {},
  game = {
    currentPlayer: 1,
    player: 0,
    number: 0,
    gameover: false,
    folds: [0, 0],
  };

/*
 * websocket events
 */

socket.on("room", (room) => logEvent("room", room));

socket.on("forbidden", function (data) {
  logEvent("forbidden");
  if (data == "wrong_move") {
    $("#info").html("Vous ne pouvez pas jouer ici");
  } else if (data == "no_place_available") {
    $(".game").html("<h2>Désolé, le serveur est plein.</h2>");
  }
});

socket.on("status", function (state) {
  logEvent("status", state);
  if (state.status == "ready") {
    $(".game-folds").html(
      "<div class='card stat folds-1 " +
        (game.number == 1 ? "active" : "") +
        "'>" +
        "<div class='player '>Player 1</div>" +
        "<div class='folds'>0</div>" +
        "</div>" +
        "<div class='card stat folds-2 " +
        (game.number == 2 ? "active" : "") +
        "'>" +
        "<div class='player'>Player 2</div>" +
        "<div class='folds'>0</div>" +
        "</div>"
    );
  }
  if (state == "not-ready") {
    $("#info").html("En attente de joueurs");
  }
});

socket.on("number", function (num) {
  logEvent("number", num);
  $("#playerNumber").html(num);
  game.number = num;
});

socket.on("gameover", function (num) {
  logEvent("gameover", num);
  $("#info").html("Le joueur " + num + " a gagné !");
  $("#info").effect("pulsate");
  game.gameover = true;
});

displayNextPlayer = (player) => $("#info").html("Au tour du joueur " + player);

socket.on("board", function (data) {
  logEvent("board", data);
  game.currentPlayer = data.player;
  if (data.player == game.number) {
    $("#info").html("A vous de jouer");
  } else {
    displayNextPlayer(data.player);
  }
  html = "";
  console.log("cards", data.cards);
  for (card of data.cards.filter((c) => c.status === "HAND")) {
    html +=
      "<div class='card playable color-" +
      card.color.toLowerCase() +
      "' onclick='play(" +
      JSON.stringify(card) +
      ")'>" +
      card.symbol +
      "</div>";
  }
  $(".game-container").html(html);

  game.gameover = false;
});

socket.on("table", function (data) {
  logEvent("table", data);
  game.currentPlayer = data.player;
  htmTable = "";
  for (card of data.cards.filter((c) => c.status === "TABLE")) {
    htmTable +=
      "<div class='card color-" +
      card.color.toLowerCase() +
      "'>" +
      card.symbol +
      "</div>";
  }
  $(".game-table").html(htmTable);
  game.gameover = false;
});

socket.on("fold", function (data) {
  logEvent("fold", data);
  setTimeout(() => $(".game-table").html(""), 1000);
  game.currentPlayer = data.winner;
  game.folds[data.winner - 1]++;
  $(".folds-" + data.winner + " .folds").html(game.folds[data.winner - 1]);
  displayNextPlayer(game.currentPlayer);
});

/*
 * webapp inputs
 */

/*
 * game logic
 */

isMyTurn = (game) => game.player == game.number && !game.gameover;

play = (card) => {
  console.log("play", card);
  socket.emit("play", card);
};

/*
 * logs
 */

function logEvent(name, arg = "") {
  console.log(
    `%c  ${name} %c received %c ${JSON.stringify(arg)}`,
    "background: MediumSeaGreen; color: white; font-weight: bold;",
    "background: MediumSeaGreen; color: #b2e6d5;",
    "color: MediumSeaGreen;"
  );
}
