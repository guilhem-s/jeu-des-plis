import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { socket } from '../../socket';
import Table from '../Table/Table';
import ScoreBoard from '../ScoreBoard/ScoreBoard';
import AnnouncementModal from '../AnnouncementModal/AnnouncementModal';
import MancheDetails from '../MancheDetails/MancheDetails';
import GameDetails from '../GameDetails/GameDetails';
import './GameRoom.css';

function GameRoom() {
  const { gameId } = useParams();
  const location = useLocation();
  const { playerName, localPlayerId } = location.state || {};

  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState({ isStarted: false, atout: null, demandedCouleur: null });
  const [manche, setManche] = useState(1);
  const [hand, setHand] = useState([]);
  const [cardsPlayed, setCardsPlayed] = useState([]);

  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);

  const playersRef = useRef(players);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  // --- Handle Socket Events on Component Mount ---
  useEffect(() => {
    if (!gameId || !playerName) {
      console.error('Game ID or player name is missing.');
      return;
    }

    // Join the game once on component mount
    socket.emit('joinGame', { gameId, playerName });

    // Event Handlers
    const handleUpdatePlayers = (playersList) => setPlayers(playersList);
    const handleDealCards = (cards) => setHand(cards);
    const handleUpdateGameState = (state) => setGameState((prevState) => ({ ...prevState, ...state }));
    const handleUpdateManche = ({ manche }) => setManche(manche);

    // Register event listeners
    socket.on('updatePlayers', handleUpdatePlayers);
    socket.on('dealCards', handleDealCards);
    socket.on('updateGameState', handleUpdateGameState);
    socket.on('updateManche', handleUpdateManche);

    // Cleanup listeners on unmount
    return () => {
      socket.off('updatePlayers', handleUpdatePlayers);
      socket.off('dealCards', handleDealCards);
      socket.off('updateGameState', handleUpdateGameState);
      socket.off('updateManche', handleUpdateManche);
    };
  }, [gameId, playerName]);

  // --- Handle Card Play and Trick Management ---
  useEffect(() => {
    const handleCardPlayed = ({ playerId, card }) => {
      const player = playersRef.current.find((p) => p.playerId === playerId);
      if (player) {
        setCardsPlayed((prevCards) => [...prevCards, { playerId, card }]);
      }
    };

    const handleNextTurn = ({ currentPlayerId }) => {
      setCurrentPlayerId(currentPlayerId);
    };

    const handleInvalidMove = ({ message }) => {
      alert(message);
    };

    const handleStartRound = ({ currentPlayerId }) => {
      setCurrentPlayerId(currentPlayerId);
      setCardsPlayed([]);
      setAnnouncements([]);
    };

    const handleTrickWon = ({ winnerPlayerId, winningCard }) => {
      console.log(`Player ${winnerPlayerId} won the trick with`, winningCard);

      // Delay clearing the played cards for 2 seconds to display the last card
      setTimeout(() => { setCardsPlayed([]); }, 2000); // 🧹 Clear the played cards after the delay
    };

    // Register event listeners
    socket.on('cardPlayed', handleCardPlayed);
    socket.on('nextTurn', handleNextTurn);
    socket.on('invalidMove', handleInvalidMove);
    socket.on('startRound', handleStartRound);
    socket.on('trickWon', handleTrickWon);

    // Cleanup listeners on unmount
    return () => {
      socket.off('cardPlayed', handleCardPlayed);
      socket.off('nextTurn', handleNextTurn);
      socket.off('invalidMove', handleInvalidMove);
      socket.off('startRound', handleStartRound);
      socket.off('trickWon', handleTrickWon);
    };
  }, []);

  // --- Handle Announcements Phase ---
  useEffect(() => {
    const handleAnnouncementTurn = ({ playerId }) => {
      if (playerId === socket.id) { setIsAnnouncementModalOpen(true); }
    };

    const handleAnnouncementMade = ({ playerId, announcedTricks }) => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.playerId === playerId ? { ...player, announcedTricks } : player
        )
      );
      setAnnouncements((prev) => [...prev, { playerId, announcedTricks }]);
      if (playerId === socket.id) { setIsAnnouncementModalOpen(false); }
    };

    const handleInvalidAnnouncement = ({ message }) => {
      alert(message);
      setIsAnnouncementModalOpen(true);
    };

    socket.on('announcementTurn', handleAnnouncementTurn);
    socket.on('announcementMade', handleAnnouncementMade);
    socket.on('invalidAnnouncement', handleInvalidAnnouncement);

    return () => {
      socket.off('announcementTurn', handleAnnouncementTurn);
      socket.off('announcementMade', handleAnnouncementMade);
      socket.off('invalidAnnouncement', handleInvalidAnnouncement);
    };
  }, []);

  // --- Player Actions ---
  const playCard = (card) => {
    if (currentPlayerId !== socket.id) {
      alert("Ce n'est pas votre tour de jouer.");
      return;
    }
    socket.emit('playCard', { gameId, card });
    setHand((prevHand) => prevHand.filter((c) => c.valeur !== card.valeur || c.couleur !== card.couleur));
  };

  const startGame = () => {
    socket.emit('startGame', { gameId });
  };

  const handleAnnounce = (announcedTricks) => {
    socket.emit('makeAnnouncement', { gameId, announcedTricks });
  };

  // --- Render Game Components ---
  return (
    <div className="game-room">
      {/* Manche Details (Top Left) */}
      <MancheDetails manche={manche} atout={gameState.atout} />

      {/* Game Details (Top Right) */}
      <GameDetails gameId={gameId} players={players} />

      {/* ScoreBoard (Bottom Left) */}
      <div className="scoreboard-container">
        <ScoreBoard players={players} />
      </div>

      {/* Game Area */}
      {gameState.isStarted ? (
        <div className="table-container">
          <Table
            players={players}
            cardsPlayed={cardsPlayed}
            hand={hand}
            onPlayCard={playCard}
            currentPlayerId={currentPlayerId}
            localPlayerId={localPlayerId}
            atout={gameState.atout?.couleur}
            demandedCouleur={gameState.demandedCouleur}
            manche={manche}
          />
        </div>
      ) : (
        <div className="waiting-area">
          <p>En attente que la partie commence...</p>
          <button onClick={startGame}>Démarrer la partie</button>
        </div>
      )}

      {/* Announcement Modal */}
      <AnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onAnnounce={handleAnnounce}
        totalPlayers={players.length}
        manche={manche}
        announcements={announcements}
      />
    </div>
  );
}

export default GameRoom;
