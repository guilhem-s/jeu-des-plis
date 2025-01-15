// Table.js
import React from 'react';
import './Table.css';
import Card from '../Card/Card'
import PlayerHand from '../PlayerHand/PlayerHand';

function Table({ players, cardsPlayed, hand, currentPlayerId, localPlayerId, onPlayCard, atout, demandedCouleur }) {
  // Reorder players so the local player is always at index 0.
  const orderedPlayers = reorderPlayers(players, localPlayerId);

  // Helper function to get the last card played by a player
  const getLastPlayedCard = (playerId) => {
    const playerCard = cardsPlayed.find((entry) => entry.playerId === playerId);
    return playerCard ? playerCard.card : null;
  };

  return (
    <div className="table">
      {orderedPlayers.map((player, index) => {
        const isCurrentPlayer = player.playerId === currentPlayerId;
        const isLocalPlayer = player.playerId === localPlayerId;
        const positionStyles = getPlayerPositionStyle(index, orderedPlayers.length);
        const playerHand = isLocalPlayer ? hand : [];

        const lastPlayedCard = getLastPlayedCard(player.playerId);

        return (
          <div
            key={player.playerId}
            className={`player-hand-container ${isCurrentPlayer ? 'current-player' : ''}`}
            style={positionStyles}
          >
            {/* Box to display the played card */}
            <div className="played-card-box">
              {lastPlayedCard ? (
                <Card card={lastPlayedCard} isPlayable={false} isGrayed={false} />
              ) : (
                <div className="empty-card-box">🂠</div> // Placeholder for no card
              )}
            </div>

            <div className="player-name">{player.name}</div>

            <PlayerHand
              hand={playerHand}
              onPlayCard={isCurrentPlayer && isLocalPlayer ? onPlayCard : null}
              isCurrentPlayer={isCurrentPlayer && isLocalPlayer}
              isLocalPlayer={isLocalPlayer}
              atout={atout}
              demandedCouleur={demandedCouleur}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Reorder players to always have the local player at index 0.
 */
function reorderPlayers(players, localPlayerId) {
  const localIndex = players.findIndex((p) => p.playerId === localPlayerId);
  if (localIndex === -1) return players;

  return [
    ...players.slice(localIndex),
    ...players.slice(0, localIndex)
  ];
}

/**
 * Position players around the table based on the number of players.
 */

/**
 * Retourne un style de positionnement pour un joueur donné en fonction de son index (après réorg)
 * et du nombre total de joueurs.
 * 
 * Index 0 : bas, centré, pas de rotation
 * Pour 2 joueurs:
 *   - Index 1 : haut, rotation 180°
 * Pour 3 joueurs:
 *   - Index 1 : gauche, rotation 90°
 *   - Index 2 : droite, rotation -90°
 * Pour 4 joueurs:
 *   - Index 1 : gauche, rotation 90°
 *   - Index 2 : haut, rotation -90°
 *   - Index 3 : droite, rotation -90°
 */

function getPlayerPositionStyle(index, numPlayers) {
  const baseStyle = {
    position: 'absolute',
    transformOrigin: 'center center',
  };

  if (numPlayers === 2) {
    if (index === 0) {
      return { ...baseStyle, bottom: '5%', left: '50%', transform: 'translateX(-50%)' };
    } else {
      return { ...baseStyle, top: '5%', left: '50%', transform: 'translateX(-50%) rotate(180deg)' };
    }
  }

  if (numPlayers === 3) {
    if (index === 0) {
      return { ...baseStyle, bottom: '5%', left: '50%', transform: 'translateX(-50%)' };
    } else if (index === 1) {
      return { ...baseStyle, left: '5%', top: '50%', transform: 'translateY(-50%) rotate(90deg)' };
    } else {
      return { ...baseStyle, right: '5%', top: '50%', transform: 'translateY(-50%) rotate(-90deg)' };
    }
  }

  if (numPlayers === 4) {
    if (index === 0) {
      return { ...baseStyle, bottom: '5%', left: '50%', transform: 'translateX(-50%)' };
    } else if (index === 1) {
      return { ...baseStyle, left: '5%', top: '50%', transform: 'translateY(-50%) rotate(90deg)' };
    } else if (index === 2) {
      return { ...baseStyle, top: '5%', left: '50%', transform: 'translateX(-50%) rotate(-1800deg)' };
    } else {
      return { ...baseStyle, right: '5%', top: '50%', transform: 'translateY(-50%) rotate(-90deg)' };
    }
  }

  // Default position for any other number of players
  if (index === 0) {
    return { ...baseStyle, bottom: '5%', left: '50%', transform: 'translateX(-50%)' };
  } else {
    return { ...baseStyle, top: '50%', left: `${5 + (index * 10)}%`, transform: 'translateY(-50%)' };
  }
}

export default Table;