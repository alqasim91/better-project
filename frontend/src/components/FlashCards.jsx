import { useState } from 'react';

const cardConfig = [
  { key: 'description', label: 'Description', icon: '📋' },
  { key: 'objectives', label: 'Objectives', icon: '🎯' },
  { key: 'scope', label: 'Scope', icon: '📐' },
  { key: 'risks', label: 'Risks', icon: '⚠️' },
];

function FlashCard({ label, icon, content }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className={`flash-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
      <div className="flash-card-inner">
        <div className="flash-card-front">
          <span className="flash-card-icon">{icon}</span>
          <h3>{label}</h3>
          <p className="flash-card-hint">Click to reveal</p>
        </div>
        <div className="flash-card-back">
          <h3>{label}</h3>
          <p>{content}</p>
        </div>
      </div>
    </div>
  );
}

export default function FlashCards({ project }) {
  const cards = cardConfig.filter((c) => project[c.key]);

  if (cards.length === 0) return null;

  return (
    <div className="flash-cards-section">
      <h2>Charter Details</h2>
      <div className="flash-cards-grid">
        {cards.map((card) => (
          <FlashCard key={card.key} label={card.label} icon={card.icon} content={project[card.key]} />
        ))}
      </div>
    </div>
  );
}
