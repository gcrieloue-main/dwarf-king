import React, {useState} from "react";
import './Quest.css';

function Quest(props) {
    const [isShown, setIsShown] = useState(false);

    return (
        <div className={"quest"}
             onMouseEnter={() => setIsShown(true)}
             onMouseLeave={() => setIsShown(false)}>
            {!props.quest && <p>Waiting for quest selection</p>}
            {props.quest && !isShown && <p>{props.quest?.ruleName}</p>}
            {props.quest && isShown && <p className={"rule-desc"}>{props.quest?.ruleDesc}</p>}
        </div>
    );
}

export default Quest;