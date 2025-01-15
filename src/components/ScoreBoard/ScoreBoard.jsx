// src/components/ScoreBoard/ScoreBoard.js

import React from 'react';
import './ScoreBoard.css';

function ScoreBoard({ players }) {
  return (
    <div className="score-board">
      <h3>Tableau des Scores</h3>
      <table>
        <thead>
          <tr>
            <th>Joueur</th>
            <th>Score</th>
            <th>Annonces</th>
            <th>Plis Gagnés</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.playerId}>
              <td>{player.name}</td>
              <td>{player.score}</td>
              <td>{player.announcedTricks}</td>
              <td>{player.wonTricks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ScoreBoard;
