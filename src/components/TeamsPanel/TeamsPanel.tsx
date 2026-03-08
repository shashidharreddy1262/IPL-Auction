import React from 'react';
import './TeamsPanel.css';
import type { Player, TeamWithPlayers } from '../../types';
import { canTeamBidForPlayer } from '../../utils/auction';
import TeamCard from '../TeamCard/TeamCard';

interface TeamsPanelProps {
  teams: TeamWithPlayers[];
  auctionStarted: boolean;
  currentPlayer: Player | null;
  currentBidCr: number | null;
  currentBidTeamId: string | null;
  onTeamBid: (teamId: string) => void;
  onSellToTeam: (teamId: string) => void;
}

const TeamsPanel: React.FC<TeamsPanelProps> = ({
  teams,
  auctionStarted,
  currentPlayer,
  currentBidCr,
  currentBidTeamId,
  onTeamBid,
  onSellToTeam,
}) => {
  return (
    <section className="panel-card teams-panel">
      <div className="panel-header">
        <h2 className="panel-title">Teams</h2>
        {auctionStarted && <span className="panel-count">{teams.length}</span>}
      </div>

      {!auctionStarted ? (
        <div className="teams-panel-empty">
          <p className="teams-panel-empty-text">Start the auction and select default or custom teams to see them here.</p>
        </div>
      ) : (
      <div className="teams-grid">
        {teams.map((team) => {
          const isLeading = team.id === currentBidTeamId;
          const canBid = canTeamBidForPlayer(team);
          return (
            <TeamCard
              key={team.id}
              team={team}
              currentPlayer={currentPlayer}
              isLeadingBidder={isLeading}
              canBid={canBid}
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

