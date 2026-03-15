import React, { useState } from 'react';
import './AuctionPanel.css';
import type { Player, TeamWithPlayers } from '../../types';
import { canTeamAfford, canTeamBidForPlayer, formatPriceCr, getNextBid } from '../../utils/auction';
import Toast from '../Toast/Toast';
import type { ToastData } from '../Toast/Toast';

interface AuctionPanelProps {
  auctionStarted: boolean;
  roomStateLoaded?: boolean;
  onStartAuction: () => void;
  currentPlayer: Player | null;
  currentBidCr: number | null;
  teams: TeamWithPlayers[];
  currentBidTeamId: string | null;
  selectedSellTeamId: string;
  onBid: (teamId: string) => void;
  onSellToTeam: (teamId: string) => void;
  onUnsold: () => void;
  onEndAuction: () => void;
  selectedSetName?: string;
  currentSetCompleted: boolean;
  toast: ToastData | null;
  onDismissToast: () => void;
  soldImageUrl?: string;
  unsoldImageUrl?: string;
  isAuctioneer?: boolean;
  connectionError?: string | null;
  role?: 'AUCTIONEER' | 'PARTICIPANT';
  myTeamId?: string | null;
}

const DRAG_TYPE_LIVE_PLAYER = 'application/ipl-auction-live-player';

const AuctionPanel: React.FC<AuctionPanelProps> = ({
  auctionStarted,
  roomStateLoaded = true,
  onStartAuction,
  currentPlayer,
  currentBidCr,
  teams,
  currentBidTeamId,
  selectedSellTeamId,
  onBid,
  onSellToTeam,
  onUnsold,
  onEndAuction,
  selectedSetName,
  currentSetCompleted,
  toast,
  onDismissToast,
  soldImageUrl,
  unsoldImageUrl,
  isAuctioneer = true,
  connectionError = null,
  role = 'AUCTIONEER',
  myTeamId = null,
}) => {
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const safeTeams = Array.isArray(teams) ? teams : [];
  const currentBidder = currentBidTeamId != null ? String(currentBidTeamId).trim().toLowerCase() : '';
  const selectedBidder = selectedSellTeamId != null ? String(selectedSellTeamId).trim().toLowerCase() : '';
  const leadingTeam =
    safeTeams.find(
      (t) =>
        String(t.id) === String(currentBidTeamId) ||
        (currentBidder && t.name?.trim().toLowerCase() === currentBidder)
    ) || null;
  const selectedTeam =
    safeTeams.find(
      (t) =>
        String(t.id) === String(selectedSellTeamId) ||
        (selectedBidder && t.name?.trim().toLowerCase() === selectedBidder)
    ) ||
    leadingTeam ||
    null;
  const effectiveSellTeamId = selectedTeam?.id ?? currentBidTeamId ?? safeTeams[0]?.id ?? '';
  const soldPrice = currentPlayer && (currentBidCr ?? currentPlayer.basePriceCr);
  // Frontend no longer blocks sell based on purse/squad; backend is source of truth.
  const canSelectedTeamAccept = !!currentBidTeamId && !!selectedTeam && !!soldPrice;

  const leadingTeamLabel = leadingTeam
    ? `${leadingTeam.shortName || leadingTeam.name || 'Team'}`
    : null;

  const isParticipantView = role === 'PARTICIPANT';
  const myTeam =
    safeTeams.find(
      (team) =>
        String(team.id) === String(myTeamId) ||
        (myTeamId != null && team.name?.trim().toLowerCase() === String(myTeamId).trim().toLowerCase())
    ) || null;
  const isOwnTeamLeading =
    isParticipantView &&
    myTeamId != null &&
    currentBidTeamId != null &&
    String(currentBidTeamId) === String(myTeamId);
  // If no leading team yet, ignore currentBidCr (backend sets it to basePriceCr on select)
  // so first bid = basePriceCr; otherwise increment from currentBidCr
  const participantNextBidCr =
    currentPlayer && isParticipantView && !!myTeamId
      ? getNextBid(currentBidTeamId ? currentBidCr : null, currentPlayer.basePriceCr)
      : null;
  const isParticipantSquadFull = !!myTeam && !canTeamBidForPlayer(myTeam);
  const isParticipantShortOnPurse =
    !!myTeam && participantNextBidCr != null && !canTeamAfford(myTeam, participantNextBidCr);
  const participantCanBid =
    isParticipantView &&
    !!myTeamId &&
    !!currentPlayer &&
    !isOwnTeamLeading &&
    !isParticipantSquadFull &&
    !isParticipantShortOnPurse;
  const sellButtonLabel =
    currentBidTeamId && selectedTeam
      ? `Sell to ${selectedTeam.shortName || selectedTeam.name || 'team'}`
      : 'No bid';

  return (
    <section className="panel-card auction-panel">
      <div className="panel-header">
        <h2 className="panel-title">Auctioneer</h2>
        {currentPlayer && <span className="panel-count">Live</span>}
      </div>

      {!auctionStarted ? (
        <div className="auction-empty auction-empty--start">
          {!roomStateLoaded ? (
            <p className="hint">Connecting to auction room…</p>
          ) : isAuctioneer ? (
            <button
              type="button"
              className="auction-start-btn"
              onClick={onStartAuction}
            >
              <span className="auction-start-btn-icon" aria-hidden />
              START THE AUCTION
            </button>
          ) : (
            <p className="hint">Waiting for the auctioneer to start the auction…</p>
          )}
        </div>
      ) : !currentPlayer ? (
        <div className="auction-empty auction-empty--no-player">
          <div className="auction-empty-content">
            {isAuctioneer && (
              <>
                <p>No player is currently under the hammer.</p>
                <p className="hint">Select a player from the Available Players panel to start.</p>
              </>
            )}
            {!isAuctioneer && !currentSetCompleted && (
              <>
                <p>Waiting for the auctioneer to bring the next player under the hammer.</p>
                <p className="hint">Please wait while the next player is sent to the auction panel.</p>
              </>
            )}
            {currentSetCompleted && selectedSetName && (
              <p className="auction-set-completed">
                <strong>{selectedSetName}</strong> completed. We will start the next set in a few minutes.
              </p>
            )}
          </div>
          {isAuctioneer && (
            <>
              <button
                type="button"
                className="auction-end-btn-inline auction-end-btn--bottom-left"
                onClick={() => setShowEndConfirm(true)}
              >
                End auction
              </button>
              {showEndConfirm && (
                <div className="auction-end-confirm-backdrop" onClick={() => setShowEndConfirm(false)}>
                  <div className="auction-end-confirm" onClick={(e) => e.stopPropagation()}>
                    <p className="auction-end-confirm-title">End auction?</p>
                    <p className="auction-end-confirm-text">
                      Are you sure you want to end the auction? You will return to the start screen.
                    </p>
                    <div className="auction-end-confirm-actions">
                      <button
                        type="button"
                        className="auction-end-confirm-cancel"
                        onClick={() => setShowEndConfirm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="auction-end-confirm-yes"
                        onClick={() => {
                          setShowEndConfirm(false);
                          onEndAuction();
                        }}
                      >
                        Yes, end auction
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
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
                  {formatPriceCr(currentBidCr ?? currentPlayer.basePriceCr)}
                </span>
              </div>
            </div>

            <div className="auction-leading">
              <span className="label">Leading Team</span>
              <span className="value">
                {leadingTeamLabel ? leadingTeamLabel : 'No bids yet'}
              </span>
            </div>
          </div>

          {isParticipantView && currentPlayer && (
            <div className="auction-participant-bid">
              <button
                type="button"
                className="auction-participant-bid-btn"
                disabled={!participantCanBid || !participantNextBidCr}
                onClick={() => {
                  if (!participantCanBid || !participantNextBidCr || !myTeamId) return;
                  onBid(myTeamId);
                }}
              >
                {participantCanBid && participantNextBidCr
                  ? `Bid ${formatPriceCr(participantNextBidCr)}`
                  : isOwnTeamLeading
                    ? 'You are currently leading'
                    : isParticipantSquadFull
                      ? 'Squad complete'
                      : isParticipantShortOnPurse
                        ? 'Insufficient purse'
                    : 'Waiting for your turn'}
              </button>
              <p className="auction-participant-bid-hint">
                {isParticipantSquadFull
                  ? 'You have completed your squad.'
                  : isParticipantShortOnPurse
                    ? 'You do not have enough purse left for the next bid.'
                : leadingTeamLabel
                  ? `Currently leading: ${leadingTeamLabel}`
                  : 'No bids yet – you can start the bidding.'}
              </p>
            </div>
          )}

          {isAuctioneer && (
            <>
              {connectionError && (
                <p className="auction-connection-error" role="alert">
                  {connectionError}
                </p>
              )}
              <div className="auction-hint auction-hint--above">
                Once bidding ends, select the winning team and click ‘Sell To’ to award the player.
              </div>
              <div className="auction-actions auction-actions--row">
                {!currentBidTeamId && (
                  <button
                    className="auction-action-btn auction-action-btn--unsold auction-mark-unsold-btn"
                    type="button"
                    onClick={() => onUnsold()}
                  >
                    Mark Unsold
                  </button>
                )}
                <button
                  className={`auction-action-btn auction-sell-to-team-btn ${
                    currentBidTeamId ? 'auction-action-btn--sold' : 'auction-sell-to-team-btn--no-bid'
                  }`}
                  type="button"
                  onClick={() => {
                    if (!effectiveSellTeamId || !canSelectedTeamAccept) return;
                    onSellToTeam(effectiveSellTeamId);
                  }}
                  disabled={!currentBidTeamId || !effectiveSellTeamId || !canSelectedTeamAccept}
                >
                  {sellButtonLabel}
                </button>
                <button
                  type="button"
                  className="auction-end-btn-inline"
                  onClick={() => setShowEndConfirm(true)}
                >
                  End auction
                </button>
              </div>
            </>
          )}

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
            unsoldImageUrl={unsoldImageUrl}
            onDismiss={onDismissToast}
            duration={2000}
          />
        </div>
      )}
    </section>
  );
};

export default AuctionPanel;

