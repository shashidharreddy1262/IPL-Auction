import React, { useState } from 'react';
import './AuctionPanel.css';
import type { Player, TeamWithPlayers } from '../../types';
import { canTeamAfford, canTeamBidForPlayer, formatPriceCr, getNextBid } from '../../utils/auction';
import Toast from '../Toast/Toast';
import type { ToastData } from '../Toast/Toast';
import TeamSetupModal from '../TeamSetupModal/TeamSetupModal';

interface AuctionPanelProps {
  auctionStarted: boolean;
  onStartAuction: () => void;
  showTeamSetup?: boolean;
  onConfirmTeams?: (teams: TeamWithPlayers[]) => void;
  onCloseTeamSetup?: () => void;
  currentPlayer: Player | null;
  currentBidCr: number | null;
  teams: TeamWithPlayers[];
  currentBidTeamId: string | null;
  selectedSellTeamId: string;
  onSelectSellTeamId: (teamId: string) => void;
  onBid: (teamId: string) => void;
  onSellToTeam: (teamId: string) => void;
  onUnsold: () => void;
  onEndAuction: () => void;
  selectedSetName?: string;
  currentSetCompleted: boolean;
  nextSetName?: string;
  toast: ToastData | null;
  onDismissToast: () => void;
  soldImageUrl?: string;
}

const DRAG_TYPE_LIVE_PLAYER = 'application/ipl-auction-live-player';

const AuctionPanel: React.FC<AuctionPanelProps> = ({
  auctionStarted,
  onStartAuction,
  showTeamSetup = false,
  onConfirmTeams,
  onCloseTeamSetup,
  currentPlayer,
  currentBidCr,
  teams,
  currentBidTeamId,
  selectedSellTeamId,
  onSelectSellTeamId,
  onBid,
  onSellToTeam,
  onUnsold,
  onEndAuction,
  selectedSetName,
  currentSetCompleted,
  nextSetName,
  toast,
  onDismissToast,
  soldImageUrl,
}) => {
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const leadingTeam = teams.find((t) => t.id === currentBidTeamId) || null;
  const effectiveSellTeamId = selectedSellTeamId || currentBidTeamId || (teams[0]?.id ?? '');
  const selectedTeam = teams.find((t) => t.id === effectiveSellTeamId);
  const soldPrice = currentPlayer && (currentBidCr ?? currentPlayer.basePriceCr);
  const canSelectedTeamAccept = selectedTeam
    ? canTeamBidForPlayer(selectedTeam) && (soldPrice != null && canTeamAfford(selectedTeam, soldPrice))
    : false;

  return (
    <section className="panel-card auction-panel">
      {showTeamSetup && onConfirmTeams && onCloseTeamSetup && (
        <TeamSetupModal
          isOpen
          onClose={onCloseTeamSetup}
          onConfirm={onConfirmTeams}
          embedded
        />
      )}
      <div className="panel-header">
        <h2 className="panel-title">Auctioneer</h2>
        {currentPlayer && <span className="panel-count">Live</span>}
      </div>

      {!auctionStarted ? (
        <div className="auction-empty auction-empty--start">
          <button
            type="button"
            className="auction-start-btn"
            onClick={onStartAuction}
          >
            <span className="auction-start-btn-icon" aria-hidden />
            START THE AUCTION
          </button>
        </div>
      ) : !currentPlayer ? (
        <div className="auction-empty auction-empty--no-player">
          <div className="auction-empty-content">
            <p>No player is currently under the hammer.</p>
            <p className="hint">Select a player from the Available Players panel to start.</p>
            {currentSetCompleted && selectedSetName && (
              <p className="auction-set-completed">
                <strong>{selectedSetName}</strong> completed. We will start the next set
                {nextSetName && (
                  <> (<strong>{nextSetName}</strong>) in the next few minutes.</>
                )}
                Select the next set in Available Players when ready.
              </p>
            )}
          </div>
          <button type="button" className="auction-end-btn-inline auction-end-btn--bottom-left" onClick={() => setShowEndConfirm(true)}>
            End auction
          </button>
          {showEndConfirm && (
            <div className="auction-end-confirm-backdrop" onClick={() => setShowEndConfirm(false)}>
              <div className="auction-end-confirm" onClick={(e) => e.stopPropagation()}>
                <p className="auction-end-confirm-title">End auction?</p>
                <p className="auction-end-confirm-text">Are you sure you want to end the auction? You will return to the start screen.</p>
                <div className="auction-end-confirm-actions">
                  <button type="button" className="auction-end-confirm-cancel" onClick={() => setShowEndConfirm(false)}>Cancel</button>
                  <button type="button" className="auction-end-confirm-yes" onClick={() => { setShowEndConfirm(false); onEndAuction(); }}>Yes, end auction</button>
                </div>
              </div>
            </div>
          )}
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
                {currentPlayer.franchise && (
                  <div className="auction-player-franchise">{currentPlayer.franchise}</div>
                )}
                <div className="auction-player-role">{currentPlayer.role}</div>
              </div>
              <div className="auction-player-meta">
                {currentPlayer.country} · {currentPlayer.capped === true ? 'Capped' : currentPlayer.capped === false ? 'Uncapped' : '–'}
              </div>
            </div>

            <div className="auction-prices">
              <div className="price-block price-block--base">
                <span className="label">Base Price</span>
                <span className="value">{formatPriceCr(currentPlayer.basePriceCr)}</span>
              </div>
              <div className="price-block price-block--current-bid">
                <span className="label">Current Bid</span>
                <span className="value value--current-bid">
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

          <div className="auction-hint auction-hint--above">
            Click a team to place a bid, or drag this player onto a team card to sell.
          </div>
          <div className="auction-actions auction-actions--row">
            <button
              className={`auction-action-btn auction-sell-to-team-btn ${currentBidTeamId ? 'auction-action-btn--sold' : 'auction-sell-to-team-btn--no-bid'}`}
              type="button"
              onClick={() => effectiveSellTeamId && onSellToTeam(effectiveSellTeamId)}
              disabled={!currentBidTeamId || !effectiveSellTeamId || !canSelectedTeamAccept}
              style={currentBidTeamId && selectedTeam ? {
                background: `linear-gradient(135deg, ${selectedTeam.primaryColor} 0%, ${selectedTeam.secondaryColor} 100%)`,
                border: 'none',
                color: '#fff',
              } : undefined}
            >
              {currentBidTeamId && selectedTeam ? `Sell to ${selectedTeam.shortName}` : 'No bid'}
            </button>
            <button
              className={`auction-action-btn auction-action-btn--unsold ${currentBidTeamId ? 'auction-action-btn--unsold-disabled' : ''}`}
              type="button"
              onClick={onUnsold}
              disabled={!!currentBidTeamId}
              title={currentBidTeamId ? 'A team has already bid – sell to that team instead' : undefined}
            >
              Mark Unsold
            </button>
            <button type="button" className="auction-end-btn-inline" onClick={() => setShowEndConfirm(true)}>
              End auction
            </button>
          </div>

          <div className="auction-teams-strip">
            {teams.map((team) => {
              const canBid = canTeamBidForPlayer(team);
              const isLeading = team.id === currentBidTeamId;
              const nextBidCr = currentPlayer && currentBidCr != null ? getNextBid(currentBidCr, currentPlayer.basePriceCr) : 0;
              const canAfford = currentPlayer && canTeamAfford(team, nextBidCr);
              const isLeadingSoCannotBidAgain = isLeading;
              const chipDisabled = !canBid || !currentPlayer || !canAfford || isLeadingSoCannotBidAgain;
              return (
                <button
                  key={team.id}
                  type="button"
                  className={`auction-team-chip ${!canBid ? 'auction-team-chip--full' : ''} ${isLeading ? 'auction-team-chip--leading' : ''}`}
                  style={{ backgroundColor: team.primaryColor, color: '#fff' }}
                  onClick={() => {
                    if (chipDisabled) return;
                    onSelectSellTeamId(team.id);
                    if (!isLeadingSoCannotBidAgain) onBid(team.id);
                  }}
                  disabled={chipDisabled}
                >
                  <span className="chip-name">{team.shortName}</span>
                </button>
              );
            })}
          </div>

          {showEndConfirm && (
            <div className="auction-end-confirm-backdrop" onClick={() => setShowEndConfirm(false)}>
              <div className="auction-end-confirm" onClick={(e) => e.stopPropagation()}>
                <p className="auction-end-confirm-title">End auction?</p>
                <p className="auction-end-confirm-text">Are you sure you want to end the auction? You will return to the start screen.</p>
                <div className="auction-end-confirm-actions">
                  <button type="button" className="auction-end-confirm-cancel" onClick={() => setShowEndConfirm(false)}>Cancel</button>
                  <button type="button" className="auction-end-confirm-yes" onClick={() => { setShowEndConfirm(false); onEndAuction(); }}>Yes, end auction</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {auctionStarted && toast && (
        <div className="auction-toast-wrap">
          <Toast
            data={toast}
            soldImageUrl={soldImageUrl}
            onDismiss={onDismissToast}
          />
        </div>
      )}
    </section>
  );
};

export default AuctionPanel;

