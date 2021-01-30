import React, { useState, useEffect } from 'react'
import socketIOClient from 'socket.io-client'
import 'react-notifications-component/dist/theme.css'
import Card from './components/Card/Card'
import Score from './components/Score/Score'
import './App.css'
import Quest from './components/Quest/Quest'
import Lobby from './components/Lobby/Lobby'
import Flip from 'react-reveal/Flip'
import QuestSelector from './components/QuestSelector/QuestSelector'
import { useBeforeunload } from 'react-beforeunload'
import RoundResult from './components/RoundResult/RoundResult'

const modeDev = true
const ENDPOINT = 'http://127.0.0.1:8080'
const socket = modeDev ? socketIOClient(ENDPOINT) : socketIOClient()

function App() {
    const [games, setGames] = useState([])
    const [room, setRoom] = useState('')

    const [currentPlayer, setCurrentPlayer] = useState(undefined)
    const [firstPlayer, setFirstPlayer] = useState(undefined)
    const [status, setStatus] = useState({})
    const [number, setNumber] = useState(undefined)
    const [nbPlayers, setNbPlayers] = useState(0)

    const [serverError, setServerError] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)
    const [isGameOver, setIsGameOver] = useState(false)

    const [board, setBoard] = useState(undefined)
    const [quest, setQuest] = useState(undefined)
    const [rule, setRule] = useState(undefined)
    const [table, setTable] = useState(undefined)
    const [currentColor, setCurrentColor] = useState(undefined)
    const [folds, setFolds] = useState([])
    const [foldsNumbers, setFoldsNumbers] = useState([0, 0])
    const [score, setScore] = useState([])
    const [isEndOfRound, setIsEndOfRound] = useState(false)
    const [roundResult, setRoundResult] = useState(undefined)

    const [info, setInfo] = useState('')
    const [isOnAutoPlay, setIsOnAutoPlay] = useState(modeDev)

    function reset() {
        setGames([])
        setRoom(undefined)
        setCurrentPlayer(undefined)
        setNumber(undefined)
        setScore([])
        setInfo('')
        setTable(undefined)
        setBoard(undefined)
        setQuest(undefined)
        setRule(undefined)
        setFoldsNumbers([0, 0])
        setHasStarted(false)
        setCurrentColor(undefined)
    }

    function swithAutoplay() {
        setIsOnAutoPlay(!isOnAutoPlay)
    }

    useEffect(() => {
        window.addEventListener('beforeunload', function (e) {
            socket.emit('disconnect')
        })
    }, [])

    useEffect(() => {
        socket.on('connect_error', function () {
            if (!serverError) {
                reset()
                console.log('Error connecting to server', serverError)
                setServerError(true)
                console.log('Error connecting to server- after', serverError)
            }
        })
        socket.on('reconnect', function () {
            console.log('Server reconnected')
            setServerError(false)
        })
        socket.on('room', (data) => {
            console.log('room', data)
            setRoom(data)
        })
        socket.on('list', (data) => {
            console.log('list', data)
            setGames(data)
        })
        socket.on('status', (data) => {
            console.log('status', data)
            if (data.status === 'ready') {
                setCurrentPlayer(data.player)
            }
            setStatus(data.status)
        })
        socket.on('gameover', (data) => {
            setIsGameOver(true)
        })
        socket.on('number', (data) => {
            console.log('number', data)
            setNumber(data)
        })
        socket.on('nbPlayers', (nb) => {
            console.log('nbPlayers', nb)
            setNbPlayers(nb)
        })
        socket.on('board', (data) => {
            console.log('board', data.cards)
            setBoard(data.cards)
            setFolds(data.folds || [])
        })
        socket.on('quest', (data) => {
            console.log('quest', data)
            setRule(data)
        })
        socket.on('questSelection', (data) => {
            console.log('questSelection', data)
            setQuest(data)
        })
        socket.on('score', (data) => {
            console.log('score', data)
            setScore(data.score)
            setFoldsNumbers([])
            setIsEndOfRound(true)
            setRoundResult(data)
        })
        socket.on('table', (data) => {
            console.log('table', data)
            setTable(data.cards)
            setCurrentPlayer(data.player)
            setCurrentColor(data.currentColor)
            setFirstPlayer(data.firstPlayer)
        })
        socket.on('fold', (data) => {
            console.log('fold', data)
            setFoldsNumbers(data.foldsNumbers)
            setCurrentPlayer(data.winner)
            setTimeout(() => setTable([]), 500)
        })

        list()
    }, [])

    useBeforeunload(() => socket.emit('disconnect'))

    useEffect(() => {
        if (currentPlayer === number) {
            setInfo("It's your turn")
        } else if (currentPlayer) {
            setInfo("It's player's " + currentPlayer + ' turn')
        }
    }, [currentPlayer, number])

    useEffect(() => {
        if (isGameOver) {
            setInfo('Game is over')
        }
    }, [isGameOver])

    useEffect(() => {
        if (status === 'not-ready') {
            reset()
        } else if (status === 'ready') {
            setHasStarted(true)
        } else if (status === 'disconnected') {
            reset()
            list()
        }
    }, [status])

    useEffect(() => {
        if (isOnAutoPlay && isMyTurn() && quest?.[0] && !rule) {
            onQuestSelect(0)
        }
    }, [quest, currentPlayer])

    useEffect(() => {
        if (modeDev) {
            setTimeout(() => autoPlay(), 500)
        }
    }, [quest, table, board, rule, currentPlayer, isEndOfRound])

    function autoPlay() {
        if (!isOnAutoPlay || !isMyTurn() || !hasStarted || isEndOfRound) return
        const playablesCards = board?.filter((card) => canPlay(card))
        if (playablesCards && playablesCards.length) {
            const randomCard =
                playablesCards[
                    Math.floor(Math.random() * playablesCards.length)
                ]
            play(randomCard)
        } else {
            console.log('auto play', 'nothing to play')
        }
    }

    function list() {
        socket.emit('list')
    }

    function play(card) {
        console.log('play', card)
        socket.emit('play', card)
        setCurrentPlayer(undefined)
    }

    function create() {
        console.log('create new game')
        socket.emit('create')
    }

    function join(gameId) {
        console.log('join', gameId)
        socket.emit('join', gameId)
    }

    function start(gameId) {
        console.log('start', gameId)
        socket.emit('start', gameId)
    }

    function onQuestSelect(index) {
        socket.emit('questSelected', index)
    }

    function canPlay(card) {
        const firstRightColorCard = board.find((c) => c.color === currentColor)
        return (
            number === currentPlayer &&
            rule &&
            (!currentColor || // soit la couleur du tout courant n'est pas définie
                card.color === currentColor || // soit la carte jouée a la bonne couleur
                !firstRightColorCard)
        ) // soit le joueur n'a aucune carte de la bonne couleur
    }

    const isMyTurn = () => {
        return number === currentPlayer
    }

    /**
     * The table cards are ordered according to the player number.
     * This function reorder the cards with the first player of the round as the first card.
     */
    function reorderWithFirstIndex(firstPlayer, table) {
        if (!firstPlayer || !table) {
            return []
        }
        const idxArray = []
        for (let i = firstPlayer - 1; i < table.length; i++) {
            idxArray.push(i)
        }
        for (let i = 0; i < firstPlayer - 1; i++) {
            idxArray.push(i)
        }
        console.log('idx Array', idxArray)
        return idxArray.map((i) => table[i])
    }

    return (
        <>
            <header className={'main-header'}>
                <h1>
                    <img src={'./img/crown.png'} alt={''} />
                    Dwarf King
                    {modeDev && (
                        <input
                            type="checkbox"
                            checked={isOnAutoPlay}
                            onClick={swithAutoplay}
                        ></input>
                    )}
                </h1>
                {hasStarted && (
                    <div className={'game-header'}>
                        <div className={'score'}>
                            {[...Array(nbPlayers).keys()].map((index) => (
                                <Score
                                    key={index}
                                    number={number}
                                    player={index + 1}
                                    currentPlayer={currentPlayer}
                                    folds={foldsNumbers?.[index] || 0}
                                    score={score?.[index] || 0}
                                />
                            ))}
                        </div>
                        <Quest quest={rule} />
                    </div>
                )}
            </header>
            <Lobby
                number={number}
                hasStarted={hasStarted}
                games={games}
                join={join}
                start={start}
                create={create}
            />
            {hasStarted && (
                <div className={'game'}>
                    <div className={'game-info'}>
                        <p>
                            <strong>{info}</strong>
                        </p>
                        <p>Room {room}</p>
                    </div>
                    {isEndOfRound && (
                        <RoundResult
                            data={roundResult}
                            nbPlayers={nbPlayers}
                            close={() => setIsEndOfRound(false)}
                        />
                    )}
                    <div className={'game-table'}>
                        {quest && !rule && (
                            <div className={'quest-selector-container'}>
                                <QuestSelector
                                    quest={quest}
                                    onQuestSelect={(index) =>
                                        onQuestSelect(index)
                                    }
                                    questSelectable={currentPlayer === number}
                                />
                            </div>
                        )}
                        {reorderWithFirstIndex(firstPlayer, table)?.map(
                            (card, index) => (
                                <div key={'b' + index}>
                                    <Card
                                        onClick={() => play(card)}
                                        playable={false}
                                        type={card?.symbol}
                                        value={card?.value}
                                        color={card?.color?.toLowerCase()}
                                    />
                                </div>
                            )
                        )}
                    </div>
                    <Flip left cascade>
                        <div
                            className={
                                'game-container' +
                                (number === currentPlayer ? ' active' : '')
                            }
                        >
                            {!isEndOfRound &&
                                board?.map((card, index) => (
                                    <div key={'a' + index}>
                                        <Card
                                            onClick={() => play(card)}
                                            playable={canPlay(card)}
                                            type={card?.symbol}
                                            value={card?.value}
                                            color={card?.color?.toLowerCase()}
                                        />
                                    </div>
                                ))}
                        </div>
                    </Flip>
                </div>
            )}
        </>
    )
}

export default App
