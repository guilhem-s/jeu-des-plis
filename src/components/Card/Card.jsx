// Card.js
import React from 'react';
import './Card.css';

function Card({ card, isPlayable, isGrayed, onClick }) {
  const handleCardClick = () => {
    if (isPlayable && onClick) {
      onClick(card);
    }
  };

  return (
    <div
      className={`card-container ${isPlayable ? 'playable' : ''} ${isGrayed ? 'grayed' : ''}`}
      onClick={handleCardClick}
    >
      <img
        src={
          card.valeur === 'verso' && card.couleur === 'carte'
            ? '/images/cartes/verso.svg'
            : `/images/cartes/${card.valeur}_${card.couleur}.svg`
        }
        alt={card.valeur === 'verso' ? 'Dos de carte' : `${card.valeur} de ${card.couleur}`}
        className="card-image"
      />
    </div>
  );
}

export default Card;
