// src/components/Lobby/Lobby.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../socket';
import './Lobby.css';

function Lobby() {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const navigate = useNavigate();

  const handleCreateGame = () => {
    const localPlayerId = socket.id;
    // Générer un identifiant de jeu unique (par exemple, avec une chaîne aléatoire)
    const newGameId = Math.random().toString(36).substring(2, 9);
    // Rediriger vers la salle de jeu avec le nouvel identifiant
    navigate(`/game/${newGameId}`, { state: { playerName, localPlayerId }});
  };

  const handleJoinGame = () => {
    const localPlayerId = socket.id;
    // Rediriger vers la salle de jeu avec l'identifiant existant
    navigate(`/game/${gameId}`, { state: { playerName, localPlayerId }});
  };

  return (
    <div className="lobby">
      <h1>Bienvenue au Jeu des Plis</h1>
      <div className="lobby-form">
        <input
          type="text"
          placeholder="Votre nom"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <div className="lobby-buttons">
          <button onClick={handleCreateGame} disabled={!playerName}>
            Créer une partie
          </button>
          <input
            type="text"
            placeholder="ID de la partie"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
          />
          <button onClick={handleJoinGame} disabled={!playerName || !gameId}>
            Rejoindre une partie
          </button>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
