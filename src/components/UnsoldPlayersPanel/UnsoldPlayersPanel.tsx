import React, { useMemo, useState } from 'react';
import './UnsoldPlayersPanel.css';
import type { Player } from '../../types';
import PlayerCard from '../PlayerCard/PlayerCard';

interface UnsoldPlayersPanelProps {
  players: Player[];
  onReAuctionAll: () => void;
  onAddBackToPool: (playerId: string) => void;
  auctionStarted: boolean;
  toastVisible?: boolean;
  isAuctioneer?: boolean;
}

const UnsoldPlayersPanel: React.FC<UnsoldPlayersPanelProps> = ({
  players,
  onReAuctionAll,
  onAddBackToPool,
  auctionStarted,
  toastVisible = false,
  isAuctioneer = true,
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return players;
    const q = search.trim().toLowerCase();
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.franchise?.toLowerCase().includes(q)) ||
        p.role.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q)
    );
  }, [players, search]);

  const showUnsoldList = auctionStarted && players.length > 0;

  return (
    <section className="panel-card unsold-panel">
      <div className="panel-header">
        <h2 className="panel-title">Unsold Players</h2>
        {auctionStarted && <span className="panel-count">{players.length}</span>}
      </div>
      {showUnsoldList && (
        <>
          <input
            type="text"
            className="unsold-search"
            placeholder="Search name, team, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isAuctioneer && (
            <div className="unsold-actions">
              <button type="button" className="unsold-reauction-btn" onClick={onReAuctionAll} disabled={toastVisible}>
                Re-auction all ({players.length})
              </button>
            </div>
          )}
        </>
      )}
      <div className="unsold-body">
        {!auctionStarted ? (
          <div className="empty-state">Start the auction to see unsold players here.</div>
        ) : players.length === 0 ? (
          <div className="empty-state">No unsold players yet.</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No players match your search.</div>
        ) : (
          <div className="unsold-list">
            {filtered.map((player) => (
              <div key={player.id} className="unsold-player-row">
                <PlayerCard player={player} />
                {isAuctioneer && (
                  <button
                    type="button"
                    className="unsold-add-back-btn"
                    onClick={() => onAddBackToPool(player.id)}
                    disabled={toastVisible}
                  >
                    Add back to pool
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default UnsoldPlayersPanel;

