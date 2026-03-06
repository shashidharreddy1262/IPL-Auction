import React from 'react';
import './AuctionPanel.css';
import type { Player, TeamWithPlayers } from '../../types';
import { canTeamBidForPlayer, formatPriceCr } from '../../utils/auction';

interface AuctionPanelProps {
  currentPlayer: Player | null;
  currentBidCr: number | null;
  teams: TeamWithPlayers[];
  currentBidTeamId: string | null;
  onBid: (teamId: string) => void;
  onSell: () => void;
  onUnsold: () => void;
  onClear: () => void;
}

const AuctionPanel: React.FC<AuctionPanelProps> = ({
  currentPlayer,
  currentBidCr,
  teams,
  currentBidTeamId,
  onBid,
  onSell,
  onUnsold,
  onClear,
}) => {
  const leadingTeam = teams.find((t) => t.id === currentBidTeamId) || null;

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
          <div className="auction-player-info">
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
                Click a team in the Teams panel below to place a bid.
              </div>
              <button className="auction-clear" type="button" onClick={onClear}>
                Clear Live Player
              </button>
            </div>

            <div className="auction-actions-right">
              <button
                className="auction-button auction-button--unsold"
                type="button"
                onClick={onUnsold}
              >
                Mark Unsold
              </button>
              <button
                className="auction-button auction-button--sold"
                type="button"
                onClick={onSell}
                disabled={!leadingTeam || currentBidCr == null}
              >
                Sell to {leadingTeam ? leadingTeam.shortName : 'Team'}
              </button>
            </div>
          </div>

          <div className="auction-teams-strip">
            {teams.map((team) => {
              const canBid = canTeamBidForPlayer(team);
              const isLeading = team.id === currentBidTeamId;
              return (
                <button
                  key={team.id}
                  type="button"
                  className={`auction-team-chip ${
                    canBid ? '' : 'auction-team-chip--full'
                  } ${isLeading ? 'auction-team-chip--leading' : ''}`}
                  onClick={() => canBid && currentPlayer && onBid(team.id)}
                  disabled={!canBid || !currentPlayer}
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

