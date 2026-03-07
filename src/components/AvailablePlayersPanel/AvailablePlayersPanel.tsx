import React from 'react';
import './AvailablePlayersPanel.css';
import type { Player } from '../../types';
import type { AuctionSet, AuctionPhase } from '../../types';
import PlayerCard from '../PlayerCard/PlayerCard';

interface AvailablePlayersPanelProps {
  players: Player[];
  onStartAuction: (playerId: string) => void;
  isPlayerInAuction: (playerId: string) => boolean;
  auctionPhase: AuctionPhase;
  onAuctionPhaseChange: (phase: AuctionPhase) => void;
  selectedSetId: string;
  onSetIdChange: (id: string) => void;
  sets: AuctionSet[];
  hasPlayerInAuction: boolean;
}

const AvailablePlayersPanel: React.FC<AvailablePlayersPanelProps> = ({
  players,
  onStartAuction,
  isPlayerInAuction,
  auctionPhase,
  onAuctionPhaseChange,
  selectedSetId,
  onSetIdChange,
  sets,
  hasPlayerInAuction,
}) => {
  const canSendToAuction = auctionPhase === 'running' && !hasPlayerInAuction;

  return (
    <section className="panel-card available-panel">
      <div className="panel-header">
        <h2 className="panel-title">Available Players</h2>
        <span className="panel-count">{players.length}</span>
      </div>

      <div className="available-controls">
        <div className="auction-phase-buttons">
          <button
            type="button"
            className={`phase-btn phase-btn--start ${auctionPhase === 'idle' ? 'phase-btn--active' : ''}`}
            onClick={() => onAuctionPhaseChange('idle')}
          >
            Stop
          </button>
          <button
            type="button"
            className={`phase-btn phase-btn--start ${auctionPhase === 'running' ? 'phase-btn--active' : ''}`}
            onClick={() => onAuctionPhaseChange('running')}
          >
            Start
          </button>
          <button
            type="button"
            className={`phase-btn phase-btn--pause ${auctionPhase === 'paused' ? 'phase-btn--active' : ''}`}
            onClick={() => onAuctionPhaseChange('paused')}
          >
            Pause
          </button>
        </div>
        <div className="set-selector-in-panel">
          <label className="set-selector-label">Set</label>
          <select
            className="set-selector-select"
            value={selectedSetId}
            onChange={(e) => onSetIdChange(e.target.value)}
          >
            {sets.map((set) => (
              <option key={set.id} value={set.id}>{set.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="available-body">
        {auctionPhase === 'idle' ? (
          <div className="empty-state empty-state--idle">
            Click <strong>Start</strong> to begin the auction and see players.
          </div>
        ) : players.length === 0 ? (
          <div className="empty-state">No players left in this set.</div>
        ) : (
          <div className="available-list">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                actionLabel={isPlayerInAuction(player.id) ? 'In Auction' : 'Send to Auction'}
                onClick={
                  canSendToAuction && !isPlayerInAuction(player.id) ? () => onStartAuction(player.id) : undefined
                }
                disabled={isPlayerInAuction(player.id) || !canSendToAuction}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AvailablePlayersPanel;

