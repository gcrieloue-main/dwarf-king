import React from "react";
import './Card.css';

function Card(props) {

    function play() {
        if (props.playable) {
            props.onClick();
        }
    }

    function cardSymbol(type, value) {
        if (value > 11) {
            return type[0];
        }
        return value;
    }

    return (
        <div onClick={play} className={`card color-${props.color}${props.playable ? " playable" : ""}`}>
            <span className={"corner-top-left"}>{cardSymbol(props.type, props.value)}</span>
            <span className={"corner-top-right"}>{cardSymbol(props.type, props.value)}</span>
            <span className={"corner-bottom-left"}>{cardSymbol(props.type, props.value)}</span>
            <span className={"corner-bottom-right"}>{cardSymbol(props.type, props.value)}</span>

            <p className={'card-figure'}>
                {props.value <= 11 && props.value}
                {props.value > 11 &&
                <img src={`./img/${props.color}_${props.type.toLowerCase()}.png`} height={"80px"} alt={""}/>}</p>
            <p>{props.type}</p>
        </div>
    );
}

export default Card;