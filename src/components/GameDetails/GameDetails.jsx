// src/components/GameDetails/GameDetails.js

import React from 'react';
import './GameDetails.css';

function GameDetails({ gameId, players }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(gameId)
  };

  return (
    <div className="game-details">
      <div className="game-id-container">
        <div className="game-id">
          <h3>Partie ID :</h3>
          <span>{gameId}</span>
        </div>
        <button onClick={copyToClipboard} className="copy-button">Copier</button>
      </div>
      <div className="players-list">
        <h3>Joueurs</h3>
        <ul>
          {players.map((player) => (
            <li key={player.playerId} className="player-item">
              {player.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default GameDetails;
