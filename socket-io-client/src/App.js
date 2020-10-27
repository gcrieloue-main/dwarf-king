import React, {useState, useEffect} from "react";
import socketIOClient from "socket.io-client";
import ReactNotification from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'
import {store as notificationStore} from 'react-notifications-component';
import Card from "./components/Card/Card";
import Score from "./components/score/Score";
import './App.css'
import Quest from "./components/quest/Quest";

const ENDPOINT = "http://127.0.0.1:4001";
const socket = socketIOClient(ENDPOINT);

function App() {
    const [room, setRoom] = useState("");
    const [currentPlayer, setCurrentPlayer] = useState(undefined);
    const [status, setStatus] = useState({});
    const [number, setNumber] = useState(undefined);
    const [board, setBoard] = useState(undefined);
    const [quest, setQuest] = useState(undefined);
    const [table, setTable] = useState(undefined);
    const [foldsNumbers, setFoldsNumbers] = useState([0, 0]);
    const [folds, setFolds] = useState([]);
    const [score, setScore] = useState([]);

    useEffect(() => {
        socket.on("room", data => {
            console.log("room", data);
            setRoom(data);
        });
        socket.on("status", data => {
            console.log("status", data);
            notify("status", data);
            if (status === 'not-ready') {
                reset();
            } else if (status === 'ready') {
            }
            setStatus(data.status);
            setCurrentPlayer(data.player);
        });
        socket.on("number", data => {
            console.log("number", data);
            setNumber(data)
        });
        socket.on("board", data => {
            console.log("board", data.cards);
            setBoard(data.cards);
            setFolds(data.folds || []);
        });
        socket.on("quest", data => {
            console.log("quest", data);
            setQuest(data);
        });
        socket.on("score", data => {
            console.log("score", data);
            setScore(data.score);
            notify("score", data);
        });
        socket.on("table", data => {
            console.log("table", data);
            setTable(data.cards);
            setCurrentPlayer(data.player);
        });
        socket.on("fold", data => {
            console.log("fold", data);
            notify("winner", number === data.winner ? 'you won' : `player ${data.winner} has won`);
            setFoldsNumbers(data.foldsNumbers);
            setCurrentPlayer(data.winner);
            setTimeout(() => setTable([]), 500);
        });

    }, []);

    function reset() {
        setCurrentPlayer(undefined);
        setNumber(undefined);
        setBoard(undefined);
        setTable(undefined);

        setFoldsNumbers([0, 0]);
        setFolds([]);
    }

    function play(card) {
        console.log('play', card);
        socket.emit("play", card);
    }

    function info() {
        if (currentPlayer === number) {
            return "A vous de jouer";
        } else {
            return "Au tour du joueur " + currentPlayer;
        }
    }

    function notify(title, text) {
        notificationStore.addNotification({
            title: title,
            message: JSON.stringify(text),
            type: "success",
            insert: "top",
            container: "top-right",
            animationIn: ["animate__animated", "animate__fadeIn"],
            animationOut: ["animate__animated", "animate__fadeOut"],
            dismiss: {
                duration: 1000
            }
        });
    }

    return (
        <div>
            <ReactNotification/>
            <p>Room {room}</p>
            <div className={"score"}>
                {[...Array(2).keys()].map(index =>
                    <Score player={index + 1}
                           folds={foldsNumbers?.[index] || 0}
                           score={score?.[index] || 0}/>)}
                <Quest quest={quest}></Quest>
            </div>
            <p><strong>Number {number}</strong></p>
            <p><strong>{info()}</strong></p>
            <div className={"game-container" + (number === currentPlayer ? " active" : "")}>
                {board?.map((card, index) => <Card key={"a" + index} onClick={(e) => play(card)}
                                                   playable={number === currentPlayer}
                                                   type={card?.symbol}
                                                   color={card?.color?.toLowerCase()}/>)}
            </div>
            <div className={"game-table"}>
                {table?.map((card, index) => <Card key={"b" + index} type={card?.symbol}
                                                   color={card?.color?.toLowerCase()}/>)}
            </div>
        </div>
    );
}

export default App;