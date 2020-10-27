import React from "react";
import './Score.css';

function Score(props) {
    return (
        <div className={"card"}>
            <p>Player {props.player}</p>
            <p>Folds {props.folds}</p>
            <p>Score {props.score}</p>
        </div>
    );
}

export default Score;