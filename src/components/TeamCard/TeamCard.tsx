import React, { useState } from 'react';
import './TeamCard.css';
import type { TeamWithPlayers, Player } from '../../types';
import { formatPriceCr, getRemainingPurseCr } from '../../utils/auction';

const DRAG_TYPE_LIVE_PLAYER = 'application/ipl-auction-live-player';

interface TeamCardProps {
  team: TeamWithPlayers;
  currentPlayer: Player | null;
  isLeadingBidder: boolean;
  onBid: () => void;
  canBid: boolean;
  onSellToTeam?: (teamId: string) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({
  team,
  currentPlayer,
  isLeadingBidder,
  onBid,
  canBid,
  onSellToTeam,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const disabled = !currentPlayer || !canBid;
  const label = currentPlayer ? 'Place Bid' : 'No Player Live';
  const canAcceptDrop = currentPlayer && canBid && onSellToTeam;
  const remainingPurseCr = getRemainingPurseCr(team);

  const handleDragOver = (e: React.DragEvent) => {
    if (!canAcceptDrop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    if (!canAcceptDrop) return;
    if (!e.dataTransfer.types.includes(DRAG_TYPE_LIVE_PLAYER)) return;
    e.preventDefault();
    onSellToTeam?.(team.id);
  };

  return (
    <div
      className={`team-card ${isDragOver ? 'team-card--drag-over' : ''}`}
      style={{
        borderColor: isLeadingBidder ? team.secondaryColor : 'rgba(255,255,255,0.1)',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="team-header">
        <div className="team-name-block">
          <div
            className="team-short team-short-badge"
            style={{ backgroundColor: team.primaryColor, color: '#fff' }}
          >
            {team.shortName}
          </div>
          <div className="team-full-name">{team.name}</div>
          <div className="team-purse">
            Purse left: <strong>{formatPriceCr(remainingPurseCr)}</strong>
          </div>
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

