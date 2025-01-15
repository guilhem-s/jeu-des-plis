import React from 'react';
import ReactDOM from 'react-dom';
import './AnnouncementModal.css';

function AnnouncementModal({
  isOpen,
  onAnnounce,
  totalPlayers,
  manche,
  announcements,
}) {
  if (!isOpen) return null;

  const totalAnnouncements = announcements.reduce(
    (sum, ann) => sum + ann.announcedTricks,
    0
  );
  const isLastPlayer = announcements.length === totalPlayers - 1;

  const options = [];
  for (let i = 0; i <= manche; i++) {
    if (isLastPlayer && totalAnnouncements + i === manche) {
      continue;
    }
    options.push(i);
  }

  const modalContent = (
    <div className="modal-overlay">
      <div className="announcement-modal">
        <h2>📢 Faites votre annonce</h2>
        <div className="options">
          {options.map((val) => (
            <button key={val} onClick={() => onAnnounce(val)}>
              {val}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default AnnouncementModal;
