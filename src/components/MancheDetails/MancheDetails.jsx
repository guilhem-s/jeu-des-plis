import React from 'react';
import './MancheDetails.css';

function MancheDetails({ manche, atout }) {
  return (
    <div className="manche-details">
      <h3>Manche : {manche}</h3>
      {atout && ( // Condition pour afficher la carte seulement si "atout" est défini
        <div className="atout-container">
          <h3>Atout :</h3>
          <img
            src={`/images/cartes/${atout.valeur}_${atout.couleur}.svg`}
            alt={`Carte ${atout.valeur} de ${atout.couleur}`}
            className="card-image"
          />
        </div>
      )}
    </div>
  );
}

export default MancheDetails;
