import React, { useState } from 'react';
import './TeamCard.css';
import type { TeamWithPlayers, Player } from '../../types';
import { formatPriceCr, getRemainingPurseCr } from '../../utils/auction';
import { getTeamLogoUrl } from '../../data/teamLogos';

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
  const logoUrl = getTeamLogoUrl(team.shortName);
  const headerBackground =
    team.primaryColor && team.secondaryColor
      ? `linear-gradient(135deg, ${team.primaryColor} 0%, ${team.secondaryColor} 100%)`
      : 'linear-gradient(135deg, #111827 0%, #020617 100%)';

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

  const isSquadFull = team.players.length >= team.maxPlayers;

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
      <div
        className="team-header team-header--gradient"
        style={{ background: headerBackground }}
      >
        {logoUrl && (
          <img src={logoUrl} alt={team.name} className="team-logo" />
        )}
        <div className="team-name-block">
          <div className="team-full-name team-full-name--primary">{team.name}</div>
          <div className="team-purse team-purse--header">
            Purse left: <strong>{formatPriceCr(remainingPurseCr)}</strong>
          </div>
        </div>
        <div className="team-count team-count--badge">
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
          {disabled ? label : `Bid for ${currentPlayer?.name}`}
        </button>
        {isSquadFull && <span className="team-full-warning">Squad full</span>}
      </div>
    </div>
  );
};

export default TeamCard;

