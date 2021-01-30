import React from 'react'
import './RoundResult.css'
import Card from '../Card/Card'

function RoundResult({ data, close, nbPlayers }) {
    return (
        <div className={'round-result-container'}>
            <div className={'round-result'}>
                <header>
                    <h2>Score</h2>
                    <p className={'rule'}>{data?.roundRule?.ruleDesc}</p>
                </header>
                <div className={'result-score'}>
                    {Array(nbPlayers)
                        .fill(undefined)
                        .map((_, i) => (
                            <div className={'score-detail'}>
                                <div className={'score-detail-player-data'}>
                                    <h2>Player {i + 1}</h2>
                                    <p>Total score : {data?.score?.[i] || 0}</p>
                                    <p>Round : +{data?.roundScore[i] || 0}</p>
                                </div>
                                <div className={'score-detail-player-folds'}>
                                    {data?.folds?.[i]?.map((fold, idx) => (
                                        <div
                                            style={{ display: 'flex' }}
                                            key={idx}
                                        >
                                            {fold[0].symbol &&
                                                fold[0].value &&
                                                fold[0].color && (
                                                    <Card
                                                        type={fold[0].symbol}
                                                        color={fold[0].color}
                                                        value={fold[0].value}
                                                    />
                                                )}
                                            {fold[1].symbol &&
                                                fold[1].value &&
                                                fold[1].color && (
                                                    <Card
                                                        type={fold[1].symbol}
                                                        color={fold[1].color}
                                                        value={fold[1].value}
                                                    />
                                                )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>
                <div className={'round-result-buttons'}>
                    <button className={'close-button'} onClick={close}>
                        Next round !
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RoundResult
