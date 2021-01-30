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

export function shuffle(array = []) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i)
        const temp = array[i]
        array[i] = array[j]
        array[j] = temp
    }
}

export function splitToChunks(array, parts) {
    const [...arr] = array
    let result = []
    for (let i = parts; i > 0; i--) {
        result.push(arr.splice(0, Math.ceil(arr.length / i)))
    }
    return result
}
