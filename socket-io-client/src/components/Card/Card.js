import React from "react";
import './Card.css';

function Card(props) {

    function play() {
        if (props.playable) {
            props.onClick();
        }
    }

    return (
        <div onClick={play} className={"card color-" + props.color + (props.playable ? " playable" : "")}>
            <p>{props.type}</p>
        </div>
    );
}

export default Card;