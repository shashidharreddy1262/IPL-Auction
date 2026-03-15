import React from 'react';
import './TeamsPanel.css';
import type { Player, TeamWithPlayers } from '../../types';
import TeamCard from '../TeamCard/TeamCard';
import { UsersIcon } from '@heroicons/react/24/outline';
import { canTeamAfford, canTeamBidForPlayer, getNextBid } from '../../utils/auction';

interface TeamsPanelProps {
  teams: TeamWithPlayers[];
  auctionStarted: boolean;
  currentPlayer: Player | null;
  currentBidCr: number | null;
  currentBidTeamId: string | null;
  onTeamBid: (teamId: string) => void;
  onSellToTeam: (teamId: string) => void;
  role: 'AUCTIONEER' | 'PARTICIPANT';
  myTeamId: string | null;
}

const TeamsPanel: React.FC<TeamsPanelProps> = ({
  teams,
  auctionStarted,
  currentPlayer,
  currentBidCr,
  currentBidTeamId,
  onTeamBid,
  onSellToTeam,
  role,
  myTeamId,
}) => {
  const safeTeams = Array.isArray(teams) ? teams : [];
  return (
    <section className="panel-card teams-panel">
      <div className="panel-header">
        <h2 className="panel-title landing-panel-title-with-icon">
          <UsersIcon className="landing-panel-title-icon" />
          <span>Teams</span>
        </h2>
        {auctionStarted && safeTeams.length > 0 && (
          <span className="panel-count">{safeTeams.length}</span>
        )}
      </div>

      {!auctionStarted ? (
        <div className="teams-panel-empty">
          <p className="teams-panel-empty-text">
            No teams in this room yet. When participants join with a team name, they will appear here.
          </p>
        </div>
      ) : safeTeams.length === 0 ? (
        <div className="teams-panel-empty">
          <p className="teams-panel-empty-text">
            No teams in this room yet. When participants join with a team name, they will appear here.
          </p>
        </div>
      ) : (
        <div className="teams-grid">
          {safeTeams.map((team) => {
            const isLeading = team.id === currentBidTeamId;
            const isOwnTeam = myTeamId != null && team.id === myTeamId;
            const isParticipant = role === 'PARTICIPANT';
            const isLeadingSoCannotBidAgain = isLeading;
            const nextBidAmount =
              currentPlayer
                ? getNextBid(currentBidTeamId ? currentBidCr : null, currentPlayer.basePriceCr)
                : null;
            const effectiveCanBid =
              isParticipant &&
              isOwnTeam &&
              !!currentPlayer &&
              !isLeadingSoCannotBidAgain &&
              canTeamBidForPlayer(team) &&
              (nextBidAmount == null || canTeamAfford(team, nextBidAmount));
            return (
              <TeamCard
                key={team.id}
                team={team}
                currentPlayer={currentPlayer}
                isLeadingBidder={isLeading}
                canBid={effectiveCanBid}
                onBid={() => onTeamBid(team.id)}
                onSellToTeam={onSellToTeam}
              />
            );
          })}
        </div>
      )}

      {auctionStarted && currentPlayer && (
        <div className="teams-footer-info">
          <span className="label">Live Player</span>
          <span className="value">
            {currentPlayer.name}{' '}
            {currentBidCr != null ? `· ₹ ${currentBidCr.toFixed(2)} Cr` : ''}
          </span>
        </div>
      )}
    </section>
  );
};

export default TeamsPanel;

