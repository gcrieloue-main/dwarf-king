import React from "react";
import "./Lobby.css"

function Lobby(props) {
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
                <button className={"create-button"} onClick={() => props.create()}>Create new game</button>
            </p>}
        </div>
    );
}

export default Lobby;