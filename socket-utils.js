import { specialLog } from './utils.js'

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
