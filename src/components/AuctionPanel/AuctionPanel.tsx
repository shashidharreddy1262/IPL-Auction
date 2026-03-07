import React, { useEffect, useState } from 'react';
import './AuctionPanel.css';
import type { Player, TeamWithPlayers } from '../../types';
import { canTeamAfford, canTeamBidForPlayer, formatPriceCr, getNextBid } from '../../utils/auction';

interface AuctionPanelProps {
  currentPlayer: Player | null;
  currentBidCr: number | null;
  teams: TeamWithPlayers[];
  currentBidTeamId: string | null;
  onBid: (teamId: string) => void;
  onIncreaseBid: () => void;
  onSellToTeam: (teamId: string) => void;
  onUnsold: () => void;
  onClear: () => void;
}

const DRAG_TYPE_LIVE_PLAYER = 'application/ipl-auction-live-player';

const AuctionPanel: React.FC<AuctionPanelProps> = ({
  currentPlayer,
  currentBidCr,
  teams,
  currentBidTeamId,
  onBid,
  onIncreaseBid,
  onSellToTeam,
  onUnsold,
  onClear,
}) => {
  const [selectedSellTeamId, setSelectedSellTeamId] = useState<string>(currentBidTeamId ?? '');
  const leadingTeam = teams.find((t) => t.id === currentBidTeamId) || null;

  useEffect(() => {
    if (currentBidTeamId) {
      setSelectedSellTeamId(currentBidTeamId);
    } else if (currentPlayer) {
      const firstAvailable = teams.find((t) => canTeamBidForPlayer(t));
      setSelectedSellTeamId((prev) => prev || firstAvailable?.id || teams[0]?.id || '');
    }
  }, [currentPlayer, currentBidTeamId, teams]);

  const effectiveSellTeamId = selectedSellTeamId || currentBidTeamId || (teams[0]?.id ?? '');
  const selectedTeam = teams.find((t) => t.id === effectiveSellTeamId);
  const soldPrice = currentPlayer && (currentBidCr ?? currentPlayer.basePriceCr);
  const canSelectedTeamAccept = selectedTeam
    ? canTeamBidForPlayer(selectedTeam) && (soldPrice != null && canTeamAfford(selectedTeam, soldPrice))
    : false;

  return (
    <section className="panel-card auction-panel">
      <div className="panel-header">
        <h2 className="panel-title">Auctioneer</h2>
        {currentPlayer && <span className="panel-count">Live</span>}
      </div>

      {!currentPlayer ? (
        <div className="auction-empty">
          <p>No player is currently under the hammer.</p>
          <p className="hint">Select a player from the Available Players panel to start.</p>
        </div>
      ) : (
        <div className="auction-body">
          <div
            className="auction-player-info auction-player-info--draggable"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(DRAG_TYPE_LIVE_PLAYER, '1');
              e.dataTransfer.effectAllowed = 'move';
            }}
          >
            <div className="auction-player-main">
              <div>
                <div className="auction-player-name">{currentPlayer.name}</div>
                <div className="auction-player-role">{currentPlayer.role}</div>
              </div>
              <div className="auction-player-country">{currentPlayer.country}</div>
            </div>

            <div className="auction-prices">
              <div className="price-block">
                <span className="label">Base Price</span>
                <span className="value">{formatPriceCr(currentPlayer.basePriceCr)}</span>
              </div>
              <div className="price-block">
                <span className="label">Current Bid</span>
                <span className="value highlight">
                  {currentBidCr != null ? formatPriceCr(currentBidCr) : '-'}
                </span>
              </div>
            </div>

            <div className="auction-leading">
              <span className="label">Leading Team</span>
              <span className="value">
                {leadingTeam
                  ? `${leadingTeam.shortName} (${leadingTeam.name})`
                  : 'No bids yet'}
              </span>
            </div>
          </div>

          <div className="auction-actions">
            <div className="auction-actions-left">
              <div className="auction-hint">
                Click a team to place a bid, or drag this player onto a team card to sell.
              </div>
              <div className="auction-buttons-row">
                <button
                  className="auction-button auction-button--increase"
                  type="button"
                  onClick={onIncreaseBid}
                >
                  Increase Bid
                </button>
                <button className="auction-clear" type="button" onClick={onClear}>
                  Clear Live Player
                </button>
              </div>
            </div>

            <div className="auction-actions-right">
              <button
                className="auction-button auction-button--unsold"
                type="button"
                onClick={onUnsold}
              >
                Mark Unsold
              </button>
              <div className="auction-sell-group">
                <select
                  className="auction-sell-select"
                  value={effectiveSellTeamId}
                  onChange={(e) => setSelectedSellTeamId(e.target.value)}
                >
                  {teams.map((team) => {
                    const full = team.players.length >= team.maxPlayers;
                    const cannotAfford = soldPrice != null && !canTeamAfford(team, soldPrice);
                    return (
                      <option
                        key={team.id}
                        value={team.id}
                        disabled={full || cannotAfford}
                      >
                        {team.shortName} – {team.name} ({team.players.length}/25)
                        {cannotAfford ? ' – purse low' : ''}
                      </option>
                    );
                  })}
                </select>
                <button
                  className="auction-button auction-button--sold"
                  type="button"
                  onClick={() => effectiveSellTeamId && onSellToTeam(effectiveSellTeamId)}
                  disabled={!effectiveSellTeamId || !canSelectedTeamAccept}
                >
                  Sell to Team
                </button>
              </div>
            </div>
          </div>

          <div className="auction-teams-strip">
            {teams.map((team) => {
              const canBid = canTeamBidForPlayer(team);
              const isLeading = team.id === currentBidTeamId;
              const nextBidCr = currentPlayer && currentBidCr != null ? getNextBid(currentBidCr, currentPlayer.basePriceCr) : 0;
              const canAfford = currentPlayer && canTeamAfford(team, nextBidCr);
              return (
                <button
                  key={team.id}
                  type="button"
                  className={`auction-team-chip ${
                    canBid ? '' : 'auction-team-chip--full'
                  } ${isLeading ? 'auction-team-chip--leading' : ''}`}
                  style={{ backgroundColor: team.primaryColor, color: '#fff' }}
                  onClick={() => canBid && currentPlayer && onBid(team.id)}
                  disabled={!canBid || !currentPlayer || !canAfford}
                >
                  <span className="chip-name">{team.shortName}</span>
                  <span className="chip-count">{team.players.length}/25</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default AuctionPanel;

