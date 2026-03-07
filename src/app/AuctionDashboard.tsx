import { useMemo, useState } from 'react';

import { initialPlayers } from '../data/players';
import { initialTeams } from '../data/teams';
import { auctionSets } from '../data/sets';
import type { Player, TeamWithPlayers, AuctionPhase } from '../types';

import { canTeamAfford, canTeamBidForPlayer, getNextBid, movePlayerToTeam } from '../utils/auction';

import AvailablePlayersPanel from '../components/AvailablePlayersPanel/AvailablePlayersPanel';
import AuctionPanel from '../components/AuctionPanel/AuctionPanel';
import UnsoldPlayersPanel from '../components/UnsoldPlayersPanel/UnsoldPlayersPanel';
import TeamsPanel from '../components/TeamsPanel/TeamsPanel';
import RulesModal from '../components/RulesModal/RulesModal';
import Toast, { type ToastType } from '../components/Toast/Toast';
import {
  headerFooterAssets,
  headerTeamLogosLeft,
  headerTeamLogosRight,
} from '../data/headerFooterLogos';

const SOLD_MESSAGES = [
  'Congratulations! Great buy!',
  "You're going strong!",
  'Your team is looking perfect!',
  'Brilliant pick!',
  'Well done – building a strong squad!',
];
const UNSOLD_MESSAGES = [
  'Player moved to unsold. Can be re-auctioned later.',
  'No worries – they can come back in the re-auction round.',
];

function AuctionDashboard() {
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>(initialPlayers);
  const [unsoldPlayers, setUnsoldPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<TeamWithPlayers[]>(initialTeams);
  const [selectedSetId, setSelectedSetId] = useState<string>(auctionSets[0]?.id ?? '');
  const [showRules, setShowRules] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [auctionPhase, setAuctionPhase] = useState<AuctionPhase>('idle');

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentBidCr, setCurrentBidCr] = useState<number | null>(null);
  const [currentBidTeamId, setCurrentBidTeamId] = useState<string | null>(null);

  const availableInSelectedSet = useMemo(
    () => availablePlayers.filter((p) => !selectedSetId || p.setId === selectedSetId),
    [availablePlayers, selectedSetId]
  );

  const isPlayerInAuction = useMemo(
    () => (playerId: string) => currentPlayer?.id === playerId,
    [currentPlayer]
  );

  const handleStartAuctionForPlayer = (playerId: string) => {
    if (currentPlayer) return; // only one player in auction at a time
    const player = availablePlayers.find((p) => p.id === playerId);
    if (!player) return;

    setCurrentPlayer({ ...player, status: 'live' });
    setCurrentBidCr(player.basePriceCr);
    setCurrentBidTeamId(null);
  };

  const handleTeamBid = (teamId: string) => {
    if (!currentPlayer || currentBidCr == null) return;

    const nextBid = getNextBid(currentBidCr, currentPlayer.basePriceCr);
    setCurrentBidCr(nextBid);
    setCurrentBidTeamId(teamId);
  };

  const handleIncreaseBid = () => {
    if (!currentPlayer) return;
    const effectiveBid = currentBidCr ?? currentPlayer.basePriceCr;
    const nextBid = getNextBid(effectiveBid, currentPlayer.basePriceCr);
    setCurrentBidCr(nextBid);
  };

  const handleSellToTeam = (teamId: string) => {
    if (!currentPlayer) return;
    const team = teams.find((t) => t.id === teamId);
    const soldPrice = currentBidCr ?? currentPlayer.basePriceCr;
    if (!team || !canTeamBidForPlayer(team) || !canTeamAfford(team, soldPrice)) return;

    setAvailablePlayers((prev) => prev.filter((p) => p.id !== currentPlayer.id));
    setTeams((prev) => movePlayerToTeam(prev, currentPlayer, teamId, soldPrice));

    setToast({
      message: SOLD_MESSAGES[Math.floor(Math.random() * SOLD_MESSAGES.length)],
      type: 'sold',
    });
    setCurrentPlayer(null);
    setCurrentBidCr(null);
    setCurrentBidTeamId(null);
  };

  const handleMarkUnsold = () => {
    if (!currentPlayer) return;

    setAvailablePlayers((prev) => prev.filter((p) => p.id !== currentPlayer.id));
    setUnsoldPlayers((prev) => [
      ...prev,
      { ...currentPlayer, status: 'unsold' },
    ]);

    setToast({
      message: UNSOLD_MESSAGES[Math.floor(Math.random() * UNSOLD_MESSAGES.length)],
      type: 'unsold',
    });
    setCurrentPlayer(null);
    setCurrentBidCr(null);
    setCurrentBidTeamId(null);
  };

  const handleReAuctionUnsold = () => {
    if (unsoldPlayers.length === 0) return;
    setAvailablePlayers((prev) => [
      ...prev,
      ...unsoldPlayers.map((p) => ({ ...p, status: 'available' as const })),
    ]);
    setUnsoldPlayers([]);
  };

  const handleAddUnsoldBackToPool = (playerId: string) => {
    const player = unsoldPlayers.find((p) => p.id === playerId);
    if (!player) return;
    setUnsoldPlayers((prev) => prev.filter((p) => p.id !== playerId));
    setAvailablePlayers((prev) => [...prev, { ...player, status: 'available' as const }]);
  };

  const handleClearAuction = () => {
    setCurrentPlayer(null);
    setCurrentBidCr(null);
    setCurrentBidTeamId(null);
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-logos-row">
          <div className="app-header-teams app-header-teams--left">
            {headerTeamLogosLeft.map((src, i) => (
              <img key={i} src={src} alt="" className="app-header-team-logo" />
            ))}
          </div>
          <div className="app-header-brand">
            <h1 className="app-title-main">🏏IPL 2026 Fantasy League Auction</h1>
          </div>
          <div className="app-header-teams app-header-teams--right">
            {headerTeamLogosRight.map((src, i) => (
              <img key={i} src={src} alt="" className="app-header-team-logo" />
            ))}
          </div>
        </div>
        <p className="app-subtitle">
          Build your squad in the mega auction. 1 auctioneer · 5–10 teams · ~250 players · ₹120 Cr per team.
        </p>
        <div className="app-header-actions">
          <button type="button" className="app-rules-btn" onClick={() => setShowRules(true)}>
            How to Play / Rules
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="top-panels">
          <AvailablePlayersPanel
            players={availableInSelectedSet}
            onStartAuction={handleStartAuctionForPlayer}
            isPlayerInAuction={isPlayerInAuction}
            auctionPhase={auctionPhase}
            onAuctionPhaseChange={setAuctionPhase}
            selectedSetId={selectedSetId}
            onSetIdChange={setSelectedSetId}
            sets={auctionSets}
            hasPlayerInAuction={!!currentPlayer}
          />

          <AuctionPanel
            currentPlayer={currentPlayer}
            currentBidCr={currentBidCr}
            teams={teams}
            currentBidTeamId={currentBidTeamId}
            onBid={handleTeamBid}
            onIncreaseBid={handleIncreaseBid}
            onSellToTeam={handleSellToTeam}
            onUnsold={handleMarkUnsold}
            onClear={handleClearAuction}
          />

          <UnsoldPlayersPanel
            players={unsoldPlayers}
            onReAuctionAll={handleReAuctionUnsold}
            onAddBackToPool={handleAddUnsoldBackToPool}
          />
        </section>

        <section className="teams-section">
          <TeamsPanel
            teams={teams}
            currentPlayer={currentPlayer}
            currentBidCr={currentBidCr}
            currentBidTeamId={currentBidTeamId}
            onTeamBid={handleTeamBid}
            onSellToTeam={handleSellToTeam}
          />
        </section>
      </main>

      <footer className="app-footer">
        <p className="app-footer-copyright">
          © 2026 IPL. All rights reserved.
        </p>
      </footer>

      <RulesModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        iplMainLogoUrl={headerFooterAssets.iplMainLogo}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default AuctionDashboard;

