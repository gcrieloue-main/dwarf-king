import React from "react";
import './RoundResult.css';
import Card from "../Card/Card";

function RoundResult(props) {
    return (
        <div className={'round-result-container'}>
            <div className={'round-result'}>
                <header>
                    <h2>Score</h2>
                    <p className={'rule'}>{props?.data?.roundRule?.ruleDesc}</p>
                </header>
                <div className={'result-score'}>
                    {[0, 1].map(i => <div>
                        <h2>Player {i + 1}</h2>
                        <div className={'score-detail'}>
                            <p>Total score : {props?.data?.score?.[i] || 0}</p>
                            <p>Round score : {props?.data?.roundScore[i] || 0}</p>
                            {props?.data?.folds?.[i]?.map((fold, idx) =>
                                <div style={{display: 'flex'}} key={idx}>
                                    {fold[0].symbol && fold[0].value && fold[0].color &&
                                    <Card type={fold[0].symbol} color={fold[0].color} value={fold[0].value}/>}
                                    {fold[1].symbol && fold[1].value && fold[1].color &&
                                    <Card type={fold[1].symbol} color={fold[1].color} value={fold[1].value}/>}
                                </div>
                            )}</div>
                    </div>)}
                </div>
            </div>
            <div>
                <button className={"close-button"} onClick={props.close}>Close</button>
            </div>
        </div>
    );
}

export default RoundResult;