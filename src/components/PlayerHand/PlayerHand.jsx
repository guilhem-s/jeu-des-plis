// PlayerHand.js
import React, { useEffect, useState } from 'react';
import Card from '../Card/Card';
import './PlayerHand.css';

function PlayerHand({ hand, onPlayCard, isCurrentPlayer, isLocalPlayer, atout, demandedCouleur }) {
  const [playableCards, setPlayableCards] = useState([]);
  /**
   * Determines which cards are playable based on the game rules.
   */
  useEffect(() => {
    const determinePlayableCards = () => {
      if (!isCurrentPlayer || !isLocalPlayer) {
        return hand.map(() => false); // Not the player's turn
      }

      // If no color is demanded yet, all cards are playable
      if (!demandedCouleur) {
        return hand.map(() => true);
      }

      // Check if the player has any cards matching the demanded color
      const hasDemandedCouleur = hand.some((card) => card.couleur === demandedCouleur);

      return hand.map((card) => {
        if (hasDemandedCouleur) {
          return card.couleur === demandedCouleur;  // Must follow color
        }

        const hasAtout = hand.some((c) => c.couleur === atout);
        if (hasAtout) {
          return card.couleur === atout;  // Must play trump if no demanded color
        }

        return true;  // Otherwise, any card is allowed
      });

    };

    setPlayableCards(determinePlayableCards());
  }, [hand, isCurrentPlayer, isLocalPlayer, atout, demandedCouleur]);

  return (
    <div className={`player-hand ${isLocalPlayer ? 'current-player' : 'other-player'}`}>
      {hand.map((card, index) => {
        const displayedCard = isLocalPlayer ? card : { valeur: 'verso', couleur: 'carte' };
        const isPlayable = isCurrentPlayer && playableCards[index];
        const isGrayed = isCurrentPlayer && !playableCards[index];

        return (
          <Card
            key={index}
            card={displayedCard}
            isPlayable={isPlayable}
            isGrayed={isGrayed}
            onClick={isPlayable ? onPlayCard : null}
          />
        );
      })}
    </div>
  );
}

export default PlayerHand;
