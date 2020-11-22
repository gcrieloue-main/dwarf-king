import React from "react";
import './Score.css';

function Score(props) {
    return (
        <div
            className={"player-data"
            + (props.currentPlayer === props.player ? " current" : "")}>
            <p className={"player-name"}> {(props.player === props.number) ? "You" : "Player " + props.player}</p>
            <p>Folds {props.folds}</p>
            <p>Score {props.score}</p>
        </div>
    );
}

export default Score;