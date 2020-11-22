import React from "react";
import './QuestSelector.css';

function QuestSelector(props) {

    return (
        <div className={'quest-selector'}>
            <div className={"quest-choice" + (props.questSelectable ? " quest-selectable" : "")}
                 onClick={() => props.onQuestSelect(0)}>
                {<p>{props.quest?.[0]?.ruleName}</p>}
                {<p className={"rule-desc"}>{props.quest?.[0]?.ruleDesc}</p>}
            </div>
            <div className={"quest-choice" + (props.questSelectable ? " quest-selectable" : "")}
                 onClick={() => props.onQuestSelect(1)}>
                {<p>{props.quest?.[1]?.ruleName}</p>}
                {<p className={"rule-desc"}>{props.quest?.[1]?.ruleDesc}</p>}
            </div>
        </div>
    );
}

export default QuestSelector;