import React from 'react';
import './UnsoldPlayersPanel.css';
import type { Player } from '../../types';
import PlayerCard from '../PlayerCard/PlayerCard';

interface UnsoldPlayersPanelProps {
  players: Player[];
}

const UnsoldPlayersPanel: React.FC<UnsoldPlayersPanelProps> = ({ players }) => {
  return (
    <section className="panel-card unsold-panel">
      <div className="panel-header">
        <h2 className="panel-title">Unsold Players</h2>
        <span className="panel-count">{players.length}</span>
      </div>

      <div className="unsold-body">
        {players.length === 0 ? (
          <div className="empty-state">No unsold players yet.</div>
        ) : (
          <div className="unsold-list">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default UnsoldPlayersPanel;

