import React from 'react';
import './TeamCard.css';
import type { TeamWithPlayers, Player } from '../../types';
import { formatPriceCr } from '../../utils/auction';

interface TeamCardProps {
  team: TeamWithPlayers;
  currentPlayer: Player | null;
  isLeadingBidder: boolean;
  onBid: () => void;
  canBid: boolean;
}

const TeamCard: React.FC<TeamCardProps> = ({
  team,
  currentPlayer,
  isLeadingBidder,
  onBid,
  canBid,
}) => {
  const disabled = !currentPlayer || !canBid;
  const label = currentPlayer ? 'Place Bid' : 'No Player Live';

  return (
    <div
      className="team-card"
      style={{
        borderColor: isLeadingBidder ? team.secondaryColor : 'rgba(255,255,255,0.1)',
      }}
    >
      <div className="team-header">
        <div className="team-name-block">
          <div className="team-short" style={{ color: team.secondaryColor }}>
            {team.shortName}
          </div>
          <div className="team-full-name">{team.name}</div>
        </div>
        <div className="team-count">
          <span>{team.players.length}</span>
          <span className="team-count-max">/ {team.maxPlayers}</span>
        </div>
      </div>

      <div className="team-body">
        {team.players.length === 0 ? (
          <div className="team-empty">No players bought yet.</div>
        ) : (
          <div className="team-players">
            {team.players.map((p) => (
              <div key={p.id} className="team-player-row">
                <span className="name">{p.name}</span>
                <span className="role">{p.role}</span>
                <span className="price">{formatPriceCr(p.soldPriceCr)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="team-footer">
        <button
          type="button"
          className={`team-bid-button ${isLeadingBidder ? 'team-bid-button--leading' : ''}`}
          onClick={onBid}
          disabled={disabled}
        >
          {disabled ? label : isLeadingBidder ? 'Increase Bid' : `Bid for ${currentPlayer?.name}`}
        </button>
        {!canBid && <span className="team-full-warning">Squad full</span>}
      </div>
    </div>
  );
};

export default TeamCard;

