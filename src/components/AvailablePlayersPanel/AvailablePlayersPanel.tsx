import React from 'react';
import './AvailablePlayersPanel.css';
import type { Player } from '../../types';
import PlayerCard from '../PlayerCard/PlayerCard';

interface AvailablePlayersPanelProps {
  players: Player[];
  onStartAuction: (playerId: string) => void;
  isPlayerInAuction: (playerId: string) => boolean;
}

const AvailablePlayersPanel: React.FC<AvailablePlayersPanelProps> = ({
  players,
  onStartAuction,
  isPlayerInAuction,
}) => {
  return (
    <section className="panel-card available-panel">
      <div className="panel-header">
        <h2 className="panel-title">Available Players</h2>
        <span className="panel-count">{players.length}</span>
      </div>

      <div className="available-body">
        {players.length === 0 ? (
          <div className="empty-state">No players left in the pool.</div>
        ) : (
          <div className="available-list">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                actionLabel={isPlayerInAuction(player.id) ? 'In Auction' : 'Send to Auction'}
                onClick={
                  isPlayerInAuction(player.id) ? undefined : () => onStartAuction(player.id)
                }
                disabled={isPlayerInAuction(player.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AvailablePlayersPanel;

