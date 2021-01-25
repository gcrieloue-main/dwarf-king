import React, {useEffect, useState} from "react";
import "./Lobby.css"
import Lottie from "lottie-web-react";

function Lobby(props) {

    const [isAnimated, setIsAnimated] = useState(false);
    const [playingState, setPlayingState] = useState('stop')

    useEffect(() => {
        if (isAnimated) {
            setPlayingState('play');
        }
    }, [isAnimated]);

    const onClick = () => {
        setIsAnimated(true);
    };

    return (
        !props.hasStarted && <div className={"lobby"}>
            <h1>Lobby</h1>
            {props.games?.map((game, index) =>
                <p className={"lobby-line"} key={"c" + index}>
                    {game.id.substr(0, 13)} (players : {game.nbPlayers})
                    {!props.number && <span><button onClick={() => props.join(game.id)}>Join</button></span>}
                    {(props.number > 1 || (props.number === 1 && game.nbPlayers === 1)) && <span>Waiting</span>}
                    {props.number === 1 && game.nbPlayers > 1 && <span><button
                        onClick={() => props.start(game.id)}>Start</button></span>}
                </p>)
            }
            {!props.number && <p>
                {!isAnimated && <button className={"create-button"} onClick={onClick}>Create new game</button>}
                {isAnimated && <Lottie className={"animation"}
                                       playingState={playingState}
                                       options={{
                                           path: './lottie/72-favourite-app-icon.json',

                                       }}
                                       eventListeners={[{
                                           eventName: 'complete', callback: () => {
                                               console.log('complete');
                                               setIsAnimated(false);
                                               props.create()
                                           }
                                       }]}
                />}
            </p>}
        </div>
    );
}

export default Lobby;