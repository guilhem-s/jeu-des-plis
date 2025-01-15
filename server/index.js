// server/index.js

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // À adapter en production
    methods: ['GET', 'POST'],
  },
});

const games = {}; // Stockage des parties en cours

// Création d'un deck de cartes
function createDeck() {
  const valeurs = ['As', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Valet', 'Dame', 'Roi'];
  const couleurs = ['Coeur', 'Carreau', 'Trèfle', 'Pique'];
  const deck = [];

  couleurs.forEach((couleur) => {
    valeurs.forEach((valeur) => {
      deck.push({ valeur, couleur });
    });
  });

  return deck;
}

// Mélange du deck
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

// Fonction pour démarrer les annonces
function startAnnouncements(gameId, numberOfCards) {
  const game = games[gameId];
  if (!game) return;

  game.totalTricks = numberOfCards;
  game.currentAnnouncementIndex = 0; // Index du joueur courant pour les annonces

  // Envoyer l'événement au premier joueur pour qu'il fasse son annonce
  const currentPlayer = game.players[game.currentAnnouncementIndex];
  io.to(gameId).emit('announcementTurn', { playerId: currentPlayer.playerId });
}


// Fonction pour démarrer une nouvelle manche
function startRound(gameId) {
  const game = games[gameId];
  if (!game) return;

  // Réinitialiser les cartes jouées
  game.cardsOnTable = [];
  game.currentTurn = game.players[0].playerId; // Le premier joueur commence

  // Envoyer l'événement pour démarrer la manche
  io.to(gameId).emit('startRound', { currentPlayerId: game.currentTurn });
}

// Calculer les scores après une manche
function calculateScores(gameId) {
  const game = games[gameId];
  if (!game) return;

  console.log(`📊 Résultats de la manche ${game.manche}:`);

  game.players.forEach((player) => {
    const diff = Math.abs(player.announcedTricks - player.wonTricks);
    let pointsEarned = 0;

    if (diff === 0 && player.wonTricks === 0) {
      // Le joueur a annoncé 0 et n'a gagné aucun pli → +1 point
      pointsEarned = 1;
      player.score += pointsEarned;
      console.log(`➡️ ${player.name} a parié 0 et a gagné 0 pli(s) → +${pointsEarned} point (Total: ${player.score})`);
    } else if (diff === 0) {
      // Le joueur a réussi son contrat → +2 points par pli
      pointsEarned = 2 * player.wonTricks;
      player.score += pointsEarned;
      console.log(`➡️ ${player.name} a parié ${player.announcedTricks} pli(s) et en a gagné ${player.wonTricks} → +${pointsEarned} points (Total: ${player.score})`);
    } else {
      // Le joueur a raté son contrat → -1 point par différence
      pointsEarned = -diff;
      player.score += pointsEarned;
      console.log(`❌ ${player.name} a parié ${player.announcedTricks} pli(s) mais en a gagné ${player.wonTricks} → ${pointsEarned} point(s) (Total: ${player.score})`);
    }

    // Réinitialiser les valeurs pour la prochaine manche
    player.announcedTricks = 0;
    player.wonTricks = 0;
  });

  console.log('-----------------------------------------');

  // Mettre à jour les scores pour tous les joueurs
  io.to(gameId).emit('updatePlayers', game.players);
}

function rotatePlayers(gameId) {
  const game = games[gameId];
  if (!game) return;

  const firstPlayer = game.players.shift(); // Décaler les joueurs : le premier devient le dernier
  game.players.push(firstPlayer);

  io.to(gameId).emit('updatePlayers', game.players); // Informer tous les clients du nouvel ordre des joueurs
}

// Fonction pour démarrer une nouvelle manche
function startNewHand(gameId) {
  const game = games[gameId];
  if (!game) return;

  const numberOfCards = game.manche;

  if (numberOfCards < 1) {
    endGame(gameId);
    return;
  }

  const deck = createDeck();
  shuffleDeck(deck);

  // Distribute cards to players
  game.players.forEach((player) => {
    player.hand = deck.splice(0, numberOfCards);
    player.announcedTricks = null;
    player.wonTricks = 0;
    io.to(player.playerId).emit('dealCards', player.hand);
  });

  game.atout = deck.shift(); // Determine and broadcast the trump suit (atout)
  io.to(gameId).emit('updateGameState', { isStarted: true, atout: game.atout, manche: game.manche });

  game.announcements = []; // Reset announcements

  startAnnouncements(gameId, numberOfCards); // Start the announcements phase
}

function endGame(gameId) {
  const game = games[gameId];
  if (!game) return;

  // Envoyer l'événement de fin de partie avec les scores finaux
  io.to(gameId).emit('gameEnded', { players: game.players });

  // Supprimer la partie du serveur
  delete games[gameId];
  console.log(`La partie ${gameId} est terminée et a été supprimée.`);
}

// Fonction pour comparer les valeurs des cartes
function compareCardValeurs(valeur1, valeur2) {
  const order = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Valet', 'Dame', 'Roi', 'As'];
  const index1 = order.indexOf(valeur1);
  const index2 = order.indexOf(valeur2);

  if (index1 > index2) return 1;
  if (index1 < index2) return -1;
  return 0;
}

// Fonction pour déterminer le gagnant du pli
function determineTrickWinner(gameId) {
  const game = games[gameId];
  if (!game) return;

  const cards = game.cardsOnTable;
  const firstCard = cards[0].card

  let winningCard = firstCard;
  let winnerPlayerId = cards[0].playerId;

  cards.forEach(({ playerId, card }) => {
    if (card.couleur === game.atout.couleur && winningCard.couleur !== game.atout.couleur) {
      winningCard = card;
      winnerPlayerId = playerId;
    } else if (card.couleur === winningCard.couleur) {
      if (compareCardValeurs(card.valeur, winningCard.valeur) > 0) {
        winningCard = card;
        winnerPlayerId = playerId;
      }
    }    
  });

  // 📝 Console Log for Debugging
  console.log(`🔍 Résultat du pli avec atout: ${game.atout.couleur} et couleur demandée : ${game.demandedCouleur}`);
  cards.forEach(({ playerId, card }) => {
    const player = game.players.find((p) => p.playerId === playerId);
    console.log(`➡️ ${player.name} a joué ${card.valeur} de ${card.couleur}`);
  });

  const winner = game.players.find((p) => p.playerId === winnerPlayerId);
  console.log(`🏆 ${winner.name} a gagné le pli avec ${winningCard.valeur} de ${winningCard.couleur}`);
  console.log('-----------------------------------------');

  if (winner) { winner.wonTricks += 1; }

  setTimeout(() => { io.to(gameId).emit('clearPlayedCards'); }, 3000); // 🧹 Notify clients to clear the played cards after 2 seconds
  io.to(gameId).emit('trickWon', { winnerPlayerId, winningCard }); // Notify clients about the trick winner

  io.to(gameId).emit('updatePlayers', game.players); // 🚀 Notify clients with the updated player states

  game.cardsOnTable = [];  // Réinitialiser les cartes sur la table
  game.currentTurn = winnerPlayerId;  // Le gagnant commence le prochain pli

  const allHandsEmpty = game.players.every((p) => p.hand.length === 0); // Vérifier si tous les plis sont joués

  if (allHandsEmpty) {
    // ✅ Si la manche est terminée, calculer les scores
    calculateScores(gameId);

    // ✅ Mise à jour de la manche
    if (game.increasing) {
      if (game.manche < 7) {
        game.manche += 1;
      } else {
        game.increasing = false;
      }
    } else {
      game.manche -= 1;
    }

    rotatePlayers(gameId);
    io.to(gameId).emit('updateManche', { manche: game.manche });

    // ✅ Démarrer la nouvelle manche ou finir le jeu
    if (game.manche > 0) {
      startNewHand(gameId);
    } else {
      endGame(gameId);
    }

  } else {
    // ✅ Sinon, commencer le prochain pli
    io.to(gameId).emit('nextTurn', { currentPlayerId: game.currentTurn });
  }
}

io.on('connection', (socket) => {
  console.log(`Nouvelle connexion : ${socket.id}`);

  // Rejoindre une partie
  socket.on('joinGame', ({ gameId, playerName }) => {
    if (!gameId || !playerName) {
      console.error('Game ID ou playerName manquant.');
      return;
    }
  
    socket.join(gameId);
  
    // Créez la partie si elle n'existe pas
    if (!games[gameId]) {
      games[gameId] = {
        players: [],
        isStarted: false,
        manche: 1,
        increasing: true,
        announcements: [],
      };
    }
  
    const game = games[gameId];
  
    // Vérifiez si le joueur est déjà dans la partie
    const existingPlayer = game.players.find((p) => p.playerId === socket.id);
    if (existingPlayer) {
      console.log(`${playerName} est déjà dans la partie ${gameId}`);
      return; // Évitez d'ajouter le joueur à nouveau
    }
  
    // Ajoutez le joueur à la partie
    const newPlayer = {
      playerId: socket.id,
      name: playerName,
      hand: [],
      score: 0,
      announcedTricks: null,
      wonTricks: 0,
    };
    game.players.push(newPlayer);
  
    console.log(`${playerName} a rejoint la partie ${gameId}`);
  
    // Mettez à jour la liste des joueurs pour tous les participants
    io.to(gameId).emit('updatePlayers', game.players);
  });
  

  // Démarrer la partie
  socket.on('startGame', ({ gameId }) => {
    const game = games[gameId];
    if (!game || game.isStarted) {
      console.error(`Impossible de démarrer la partie ${gameId}`);
      return;
    }

    game.isStarted = true;
    game.currentRoundNumber = 1;
    game.increasing = true;

    // Commencer la première manche
    startNewHand(gameId);
  });

  // Recevoir les annonces des joueurs
  socket.on('makeAnnouncement', ({ gameId, announcedTricks }) => {
    const game = games[gameId];
    if (!game) {
      console.error(`La partie ${gameId} n'existe pas.`);
      return;
    }
  
    const player = game.players.find((p) => p.playerId === socket.id);
    if (player) {
      player.announcedTricks = announcedTricks;
  
      game.announcements.push({ playerId: socket.id, announcedTricks }); // Ajouter l'annonce à la liste
  
      io.to(gameId).emit('announcementMade', { playerId: socket.id, announcedTricks }); // Informer tous les joueurs de l'annonce
  
      game.currentAnnouncementIndex += 1; // Passer au joueur suivant
  
      if (game.currentAnnouncementIndex < game.players.length) {
        // Envoyer l'événement au joueur suivant
        const nextPlayer = game.players[game.currentAnnouncementIndex];
        io.to(gameId).emit('announcementTurn', { playerId: nextPlayer.playerId });
      } else {
        // Toutes les annonces ont été faites
        const totalAnnouncements = game.announcements.reduce((sum, ann) => sum + ann.announcedTricks, 0); // Calculer la somme des annonces
  
        if (totalAnnouncements === game.manche) {
          // Le dernier joueur doit refaire son annonce
          const lastPlayerId = game.announcements[game.announcements.length - 1].playerId;
          const lastPlayer = game.players.find((p) => p.playerId === lastPlayerId);
          lastPlayer.announcedTricks = null;
  
          // Retirer la dernière annonce
          game.announcements.pop();
          game.currentAnnouncementIndex = game.players.length - 1;
  
          io.to(lastPlayer.playerId).emit('invalidAnnouncement', {
            message: "La somme des annonces ne peut pas être égale au nombre total de plis. Veuillez refaire votre annonce."
          });
  
          // Informer le dernier joueur qu'il doit refaire son annonce
          io.to(gameId).emit('announcementTurn', { playerId: lastPlayer.playerId });
        } else {
          // Commencer la manche
          startRound(gameId);
        }
      }
    }
  });

  // Jouer une carte
  socket.on('playCard', ({ gameId, card }) => {
    const game = games[gameId];
    if (!game) {
      console.error(`La partie ${gameId} n'existe pas.`);
      return;
    }
  
    const player = game.players.find((p) => p.playerId === socket.id);
    if (!player) {
      console.error(`Le joueur ${socket.id} n'est pas dans la partie ${gameId}.`);
      return;
    }
  
    // Verify if it's the player's turn
    if (game.currentTurn !== socket.id) {
      socket.emit('notYourTurn', { message: "Ce n'est pas votre tour de jouer." });
      return;
    }
  
    // Verify that the player owns the card
    const cardIndex = player.hand.findIndex((c) => c.valeur === card.valeur && c.couleur === card.couleur);
    if (cardIndex === -1) {
      socket.emit('invalidMove', { message: "Vous ne possédez pas cette carte." });
      return;
    }
  
    // Set demandedCouleur when the first card is played
    if (!game.demandedCouleur && game.cardsOnTable.length === 0) {
      game.demandedCouleur = card.couleur;
      io.to(gameId).emit('updateGameState', { demandedCouleur: game.demandedCouleur });
    }
  
    // Validate the move (must follow demanded color or play trump)
    const hasDemandedCouleur = player.hand.some((c) => c.couleur === game.demandedCouleur);
    if (hasDemandedCouleur && card.couleur !== game.demandedCouleur) {
      socket.emit('invalidMove', { message: "Vous devez fournir la couleur demandée." });
      return;
    } else if (!hasDemandedCouleur) {
      const hasAtout = player.hand.some((c) => c.couleur === game.atout.couleur);
      if (hasAtout && card.couleur !== game.atout.couleur) {
        socket.emit('invalidMove', { message: "Vous devez couper avec un atout si vous n'avez pas la couleur demandée." });
        return;
      }
    }
  
    const playedCard = player.hand.splice(cardIndex, 1)[0]; // Remove the played card from the player's hand
  
    game.cardsOnTable.push({ playerId: socket.id, card: playedCard }); // Add the card to the table
  
    io.to(gameId).emit('cardPlayed', { playerId: socket.id, card: playedCard }); // Notify all players of the card played
  
    // Move to the next player
    const playerIndex = game.players.findIndex((p) => p.playerId === socket.id);
    const nextPlayerIndex = (playerIndex + 1) % game.players.length;
    game.currentTurn = game.players[nextPlayerIndex].playerId;
  
    // If all players have played, determine the winner
    if (game.cardsOnTable.length === game.players.length) {
      determineTrickWinner(gameId);
      game.demandedCouleur = null;  // Reset demanded color for the next trick
      io.to(gameId).emit('updateGameState', { demandedCouleur: game.demandedCouleur });
    } else {
      io.to(gameId).emit('nextTurn', { currentPlayerId: game.currentTurn });
    }
  });
  
  // Déconnexion d'un joueur
  socket.on('disconnect', () => {
    console.log(`Déconnexion : ${socket.id}`);

    for (const gameId in games) {
      const game = games[gameId];

      // Retirer le joueur de la partie
      game.players = game.players.filter((p) => p.playerId !== socket.id);

      // Mise à jour de la liste des joueurs
      io.to(gameId).emit('updatePlayers', game.players);

      // Supprimer la partie si elle n'a plus de joueurs
      if (game.players.length === 0) {
        delete games[gameId];
        console.log(`La partie ${gameId} a été supprimée.`);
      } else {
        // Si le joueur déconnecté était le tour courant, passer au suivant
        if (game.currentTurn === socket.id) {
          const currentPlayerIndex = game.players.findIndex((p) => p.playerId === socket.id);
          const nextPlayerIndex = (currentPlayerIndex) % game.players.length;
          game.currentTurn = game.players[nextPlayerIndex].playerId;
          io.to(gameId).emit('nextTurn', { currentPlayerId: game.currentTurn });
        }
      }
    }
  });
});

// Lancement du serveur
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
