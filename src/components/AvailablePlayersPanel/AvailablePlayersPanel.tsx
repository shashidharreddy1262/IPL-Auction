import React, { useState } from 'react';
import './AvailablePlayersPanel.css';
import type { Player } from '../../types';
import type { AuctionSet } from '../../types';
import PlayerCard from '../PlayerCard/PlayerCard';

interface AvailablePlayersPanelProps {
  players: Player[];
  onStartAuction: (playerId: string) => void;
  isPlayerInAuction: (playerId: string) => boolean;
  auctionStarted: boolean;
  selectedSetId: string;
  onSetIdChange: (id: string) => void;
  sets: AuctionSet[];
  hasPlayerInAuction: boolean;
  isAuctioneer?: boolean;
}

const AvailablePlayersPanel: React.FC<AvailablePlayersPanelProps> = ({
  players,
  onStartAuction,
  isPlayerInAuction,
  auctionStarted,
  selectedSetId,
  onSetIdChange,
  sets,
  hasPlayerInAuction,
  isAuctioneer = true,
}) => {
  const [setDropdownOpen, setSetDropdownOpen] = useState(false);
  const canSendToAuction = auctionStarted && !hasPlayerInAuction;
  const selectedSet = sets.find((s) => s.id === selectedSetId);

  return (
    <section className="panel-card available-panel">
      <div className="panel-header">
        <h2 className="panel-title">Available Players</h2>
        {auctionStarted && <span className="panel-count">{players.length}</span>}
      </div>

      {auctionStarted && (
        <>
          <div className="available-controls">
            <div className="set-selector-in-panel set-selector-dropdown-wrap">
              <span className="set-selector-label">Set</span>
              <button
                type="button"
                className="set-selector-trigger"
                onClick={() => setSetDropdownOpen((o) => !o)}
                aria-expanded={setDropdownOpen}
              >
                {selectedSet?.name ?? 'Select set'}
              </button>
              {setDropdownOpen && (
                <>
                  <div
                    className="set-selector-backdrop"
                    onClick={() => setSetDropdownOpen(false)}
                    aria-hidden
                  />
                  <div className="set-selector-list">
                    {sets.map((set) => (
                      <button
                        key={set.id}
                        type="button"
                        className="set-selector-item"
                        onClick={() => {
                          onSetIdChange(set.id);
                          setSetDropdownOpen(false);
                        }}
                      >
                        {set.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="available-body">
            {players.length === 0 ? (
              <div className="empty-state">No players left in this set.</div>
            ) : (
              <div className="available-list">
                {players.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    actionLabel={
                      isAuctioneer
                        ? (isPlayerInAuction(player.id) ? 'In Auction' : 'Send to Auction')
                        : undefined
                    }
                    onClick={
                      isAuctioneer && canSendToAuction && !isPlayerInAuction(player.id)
                        ? () => onStartAuction(player.id)
                        : undefined
                    }
                    disabled={isAuctioneer ? (isPlayerInAuction(player.id) || !canSendToAuction) : false}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default AvailablePlayersPanel;

