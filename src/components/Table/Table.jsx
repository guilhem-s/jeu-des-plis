// Table.js
import React from 'react';
import './Table.css';
import Card from '../Card/Card';
import PlayerHand from '../PlayerHand/PlayerHand';

function Table({ players, cardsPlayed, hand, currentPlayerId, localPlayerId, onPlayCard, atout, demandedCouleur, manche }) {
  const orderedPlayers = reorderPlayers(players, localPlayerId);

  // Dernière carte jouée
  const getLastPlayedCard = (playerId) => {
    const playerCard = cardsPlayed.find((entry) => entry.playerId === playerId);
    return playerCard ? playerCard.card : null;
  };

  const getRemainingCards = (playerId, manche) => {
        const cardsPlayedByPlayer = cardsPlayed.filter(card => card.playerId === playerId).length;
        return Math.max(0, manche - cardsPlayedByPlayer);  // Le nombre total de cartes - cartes jouées
      };

  return (
    <div className="table">
      {orderedPlayers.map((player, index) => {
        const isCurrentPlayer = player.playerId === currentPlayerId;
        const isLocalPlayer = player.playerId === localPlayerId;
        const positionStyles = getPlayerPositionStyle(index, orderedPlayers.length);

        // ✅ Utilise la valeur de manche pour déterminer les cartes restantes
        const remainingCards = getRemainingCards(player.playerId, manche);

        // ✅ Main affichée : vraies cartes pour le joueur local, dos de cartes pour les autres
        const playerHand = isLocalPlayer
          ? hand
          : Array.from({ length: remainingCards }, () => ({ valeur: 'verso', couleur: 'carte' }));

        console.log(`Hand for ${player.name}:`, playerHand);  // ✅ Vérification dans la console

        const lastPlayedCard = getLastPlayedCard(player.playerId);

        return (
          <div
            key={player.playerId}
            className={`player-hand-container ${isCurrentPlayer ? 'current-player' : ''}`}
            style={positionStyles}
          >
            {/* Carte jouée */}
            <div className="played-card-box">
              {lastPlayedCard ? (
                <Card card={lastPlayedCard} isPlayable={false} isGrayed={false} />
              ) : (
                <div className="empty-card-box">🂠</div>
              )}
            </div>

            <div className="player-name">{player.name}</div>

            {/* ✅ Passage correct de la main */}
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

// Réorganise les joueurs
function reorderPlayers(players, localPlayerId) {
  const localIndex = players.findIndex((p) => p.playerId === localPlayerId);
  if (localIndex === -1) return players;

  return [
    ...players.slice(localIndex),
    ...players.slice(0, localIndex),
  ];
}

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

// Position des joueurs autour de la table
function getPlayerPositionStyle(index, numPlayers) {
  const baseStyle = {
    position: 'absolute',
    transformOrigin: 'center center',
  };

  if (numPlayers === 2) {
    return index === 0
      ? { ...baseStyle, bottom: '5%', left: '50%', transform: 'translateX(-50%)' }
      : { ...baseStyle, top: '5%', left: '50%', transform: 'translateX(-50%) rotate(180deg)' };
  }

  if (numPlayers === 3) {
    if (index === 1) return { ...baseStyle, left: '5%', top: '50%', transform: 'translateY(-50%) rotate(90deg)' };
    if (index === 2) return { ...baseStyle, right: '5%', top: '50%', transform: 'translateY(-50%) rotate(-90deg)' };
  }

  if (numPlayers === 4) {
    if (index === 1) return { ...baseStyle, left: '5%', top: '50%', transform: 'translateY(-50%) rotate(90deg)' };
    if (index === 2) return { ...baseStyle, top: '5%', left: '50%', transform: 'translateX(-50%) rotate(180deg)' };
    if (index === 3) return { ...baseStyle, right: '5%', top: '50%', transform: 'translateY(-50%) rotate(-90deg)' };
  }

  return { ...baseStyle, bottom: '5%', left: '50%', transform: 'translateX(-50%)' };
}

export default Table;
