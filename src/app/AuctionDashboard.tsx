import { useEffect, useMemo, useState } from 'react';

import { initialPlayers } from '../data/players';
import { initialTeams } from '../data/teams';
import { auctionSets, selectedSetIdToPlayerSetId } from '../data/sets';
import type { Player, TeamWithPlayers } from '../types';

import { canTeamAfford, canTeamBidForPlayer, getNextBid, movePlayerToTeam } from '../utils/auction';

import AvailablePlayersPanel from '../components/AvailablePlayersPanel/AvailablePlayersPanel';
import AuctionPanel from '../components/AuctionPanel/AuctionPanel';
import UnsoldPlayersPanel from '../components/UnsoldPlayersPanel/UnsoldPlayersPanel';
import TeamsPanel from '../components/TeamsPanel/TeamsPanel';
import RulesModal from '../components/RulesModal/RulesModal';
import type { ToastData } from '../components/Toast/Toast';
import {
  headerFooterAssets,
  headerTeamLogosLeft,
  headerTeamLogosRight,
} from '../data/headerFooterLogos';

function AuctionDashboard() {
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>(initialPlayers);
  const [unsoldPlayers, setUnsoldPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<TeamWithPlayers[]>(initialTeams);
  const [selectedSetId, setSelectedSetId] = useState<string>(auctionSets[0]?.id ?? '');
  const [showRules, setShowRules] = useState(false);
  const [showTeamSetup, setShowTeamSetup] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [auctionStarted, setAuctionStarted] = useState(false);

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentBidCr, setCurrentBidCr] = useState<number | null>(null);
  const [currentBidTeamId, setCurrentBidTeamId] = useState<string | null>(null);
  const [selectedSellTeamId, setSelectedSellTeamId] = useState<string>(initialTeams[0]?.id ?? '');

  const availableInSelectedSet = useMemo(() => {
    if (!selectedSetId) return availablePlayers;
    const playerSetId = selectedSetIdToPlayerSetId[selectedSetId] ?? selectedSetId;
    return availablePlayers.filter((p) => p.setId === playerSetId);
  }, [availablePlayers, selectedSetId]);

  const selectedSet = auctionSets.find((s) => s.id === selectedSetId);
  const currentSetCompleted = auctionStarted && !currentPlayer && availableInSelectedSet.length === 0 && selectedSetId;
  const currentSetIndex = auctionSets.findIndex((s) => s.id === selectedSetId);
  const nextSet = currentSetIndex >= 0 && currentSetIndex < auctionSets.length - 1 ? auctionSets[currentSetIndex + 1] : null;

  const isPlayerInAuction = useMemo(
    () => (playerId: string) => currentPlayer?.id === playerId,
    [currentPlayer]
  );

  useEffect(() => {
    if (currentBidTeamId) {
      setSelectedSellTeamId(currentBidTeamId);
    } else if (currentPlayer && teams.length > 0) {
      const firstAvailable = teams.find((t) => canTeamBidForPlayer(t));
      setSelectedSellTeamId((prev) => prev || firstAvailable?.id || teams[0]?.id || '');
    }
  }, [currentBidTeamId, currentPlayer, teams]);

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
    setSelectedSellTeamId(teamId);
  };

  const handleSellToTeam = (teamId: string) => {
    if (!currentPlayer) return;
    const team = teams.find((t) => t.id === teamId);
    const soldPrice = currentBidCr ?? currentPlayer.basePriceCr;
    if (!team || !canTeamBidForPlayer(team) || !canTeamAfford(team, soldPrice)) return;

    setAvailablePlayers((prev) => prev.filter((p) => p.id !== currentPlayer.id));
    setTeams((prev) => movePlayerToTeam(prev, currentPlayer, teamId, soldPrice));

    setToast({
      type: 'sold',
      playerName: currentPlayer.name,
      teamName: team.name,
      priceCr: soldPrice,
    });
    // Keep currentPlayer visible until toast is dismissed so panel stays in sync
  };

  const handleMarkUnsold = () => {
    if (!currentPlayer) return;

    setAvailablePlayers((prev) => prev.filter((p) => p.id !== currentPlayer.id));
    setUnsoldPlayers((prev) => [
      ...prev,
      { ...currentPlayer, status: 'unsold' },
    ]);

    setToast({
      type: 'unsold',
      playerName: currentPlayer.name,
    });
    // Keep currentPlayer visible until toast is dismissed so panel stays in sync
  };

  const handleDismissToast = () => {
    setToast(null);
    setCurrentPlayer(null);
    setCurrentBidCr(null);
    setCurrentBidTeamId(null);
  };

  const handleReAuctionUnsold = () => {
    if (unsoldPlayers.length === 0) return;
    setAvailablePlayers((prev) => [
      ...prev,
      ...unsoldPlayers.map((p) => ({ ...p, status: 'available' as const, setId: 'reauction' })),
    ]);
    setUnsoldPlayers([]);
    setSelectedSetId('reauction');
  };

  const handleAddUnsoldBackToPool = (playerId: string) => {
    const player = unsoldPlayers.find((p) => p.id === playerId);
    if (!player) return;
    setUnsoldPlayers((prev) => prev.filter((p) => p.id !== playerId));
    setAvailablePlayers((prev) => [...prev, { ...player, status: 'available' as const, setId: 'reauction' }]);
    setSelectedSetId('reauction');
  };

  const handleEndAuction = () => {
    setAuctionStarted(false);
    setAvailablePlayers(initialPlayers.map((p) => ({ ...p, status: 'available' as const })));
    setUnsoldPlayers([]);
    setTeams(initialTeams);
    setSelectedSetId(auctionSets[0]?.id ?? '');
    setToast(null);
    setCurrentPlayer(null);
    setCurrentBidCr(null);
    setCurrentBidTeamId(null);
    setSelectedSellTeamId(initialTeams[0]?.id ?? '');
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-header-logos-row">
            <div className="app-header-teams app-header-teams--left">
              {headerTeamLogosLeft.map((src, i) => (
                <img key={i} src={src} alt="" className="app-header-team-logo" />
              ))}
            </div>
            <div className="app-header-brand">
              <h1 className="app-title-main">IPL 2026 FANTASY AUCTION</h1>
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
        </div>
      </header>

      <main className="app-main">
        <div className="top-panels-carousel-wrap">
          <div className="top-panels-scroll-wrap">
          <section className="top-panels">
            <AvailablePlayersPanel
            players={availableInSelectedSet}
            onStartAuction={handleStartAuctionForPlayer}
            isPlayerInAuction={isPlayerInAuction}
            auctionStarted={auctionStarted}
            selectedSetId={selectedSetId}
            onSetIdChange={setSelectedSetId}
            sets={auctionSets}
            hasPlayerInAuction={!!currentPlayer}
          />

          <AuctionPanel
            auctionStarted={auctionStarted}
            onStartAuction={() => setShowTeamSetup(true)}
            showTeamSetup={showTeamSetup}
            onConfirmTeams={(teams) => {
              setTeams(teams);
              setSelectedSellTeamId(teams[0]?.id ?? '');
              setAuctionStarted(true);
              setShowTeamSetup(false);
            }}
            onCloseTeamSetup={() => setShowTeamSetup(false)}
            currentPlayer={currentPlayer}
            currentBidCr={currentBidCr}
            teams={teams}
            currentBidTeamId={currentBidTeamId}
            selectedSellTeamId={selectedSellTeamId}
            onSelectSellTeamId={setSelectedSellTeamId}
            onBid={handleTeamBid}
            onSellToTeam={handleSellToTeam}
            onUnsold={handleMarkUnsold}
            onEndAuction={handleEndAuction}
            selectedSetName={selectedSet?.name}
            currentSetCompleted={!!currentSetCompleted}
            nextSetName={nextSet?.name}
            toast={toast}
            onDismissToast={handleDismissToast}
            soldImageUrl={headerFooterAssets.auctionSoldIcon}
          />

          <UnsoldPlayersPanel
            players={unsoldPlayers}
            onReAuctionAll={handleReAuctionUnsold}
            onAddBackToPool={handleAddUnsoldBackToPool}
            auctionStarted={auctionStarted}
            toastVisible={!!toast}
          />
          </section>
          </div>
        </div>

        <section className="teams-section">
          <TeamsPanel
            teams={teams}
            auctionStarted={auctionStarted}
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
    </div>
  );
}

export default AuctionDashboard;

