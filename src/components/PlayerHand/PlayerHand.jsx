// PlayerHand.js
import React, { useEffect, useState } from 'react';
import Card from '../Card/Card';
import './PlayerHand.css';

function PlayerHand({ hand, onPlayCard, isCurrentPlayer, isLocalPlayer, atout, demandedCouleur }) {
  const [playableCards, setPlayableCards] = useState([]);

  // Détermine quelles cartes sont jouables
  useEffect(() => {
    const determinePlayableCards = () => {
      if (!isCurrentPlayer || !isLocalPlayer) {
        return hand.map(() => false); // Pas le tour du joueur
      }

      if (!demandedCouleur) {
        return hand.map(() => true);
      }

      const hasDemandedCouleur = hand.some((card) => card.couleur === demandedCouleur);

      return hand.map((card) => {
        if (hasDemandedCouleur) {
          return card.couleur === demandedCouleur;
        }

        const hasAtout = hand.some((c) => c.couleur === atout);
        if (hasAtout) {
          return card.couleur === atout;
        }

        return true;
      });
    };

    setPlayableCards(determinePlayableCards());
  }, [hand, isCurrentPlayer, isLocalPlayer, atout, demandedCouleur]);

  return (
    <div className={`player-hand ${isLocalPlayer ? 'current-player' : 'other-player'}`}>
      {hand.map((card, index) => {
        const isPlayable = isCurrentPlayer && playableCards[index];
        const isGrayed = isCurrentPlayer && !playableCards[index];

        return (
          <Card
            key={index}
            card={card}
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
