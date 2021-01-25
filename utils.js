export function specialLog(...args) {
    const Reset = '\x1b[0m'
    const Bright = '\x1b[1m'
    const Dim = '\x1b[2m'
    const Underscore = '\x1b[4m'
    const Blink = '\x1b[5m'
    const Reverse = '\x1b[7m'
    const Hidden = '\x1b[8m'

    const FgBlack = '\x1b[30m'
    const FgRed = '\x1b[31m'
    const FgGreen = '\x1b[32m'
    const FgYellow = '\x1b[33m'
    const FgBlue = '\x1b[34m'
    const FgMagenta = '\x1b[35m'
    const FgCyan = '\x1b[36m'
    const FgWhite = '\x1b[37m'

    const BgBlack = '\x1b[40m'
    const BgRed = '\x1b[41m'
    const BgGreen = '\x1b[42m'
    const BgYellow = '\x1b[43m'
    const BgBlue = '\x1b[44m'
    const BgMagenta = '\x1b[45m'
    const BgCyan = '\x1b[46m'
    const BgWhite = '\x1b[47m'

    const bar = '============================================='
    const bar2 = '*********************************************'

    console.log()
    if (args[0] === 2) {
        console.log(FgCyan + bar2, ...args.slice(1), bar2 + Reset)
    } else {
        console.log(FgRed + bar, ...args, bar + Reset)
    }
    console.log()
}

/** Socket IO utils **/

export function emitToAll(io, gameId, eventName, data) {
    specialLog(2, eventName, 'to all')
    console.log(data)
    io.in(gameId).emit(eventName, data)
}

export function emitToPlayer(socket, eventName, data) {
    specialLog(2, eventName, 'to', '' + socket.player)
    console.log(data)
    socket.emit(eventName, data)
}

export function emitToEach(io, gameId, eventName, fn) {
    specialLog(2, eventName, 'to each')
    const sockets = io.sockets.sockets
    for (const socketId in sockets) {
        const currentSocket = sockets[socketId]
        if (currentSocket.game && currentSocket.game.id === gameId) {
            const data = fn(currentSocket)
            console.log('-> to player', currentSocket.player, eventName, data)
            currentSocket.emit(eventName, data)
        }
    }
}
