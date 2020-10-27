import React from "react";
import './Quest.css';

function Quest(props) {
    return (
        <div className={"card"}>
            <p>{props.quest?.ruleName}</p>
            <p>{props.quest?.ruleDesc}</p>
        </div>
    );
}

export default Quest;