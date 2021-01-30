export const colors = {
    BLUE: 'blue',
    RED: 'red',
    GREEN: 'green',
}

export const symbols = {
    TWO: 'TWO',
    THREE: 'THREE',
    FOUR: 'FOUR',
    FIVE: 'FIVE',
    SIX: 'SIX',
    SEVEN: 'SEVEN',
    HEIGHT: 'HEIGHT',
    NINE: 'NINE',
    TEN: 'TEN',
    JACK: 'JACK',
    QUEEN: 'QUEEN',
    KING: 'KING',
    ACE: 'ACE',
}

export const players = {
    PLAYER_1: 1,
    PLAYER_2: 2,
    MAX_PLAYERS: 5,
    MIN_PLAYERS: 2,

}

export const gameConfig = {
    NB_PLAYERS: 3,
    MB_TURNS: 7
}

export const events = {
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
        NB_PLAYERS: 'nbPlayers',
    },
}