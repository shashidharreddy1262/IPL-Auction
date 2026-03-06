import React, { useMemo, useState } from 'react';

import { initialPlayers } from '../data/players';
import { initialTeams } from '../data/teams';
import type { Player, TeamWithPlayers } from '../types';

import { getNextBid, movePlayerToTeam } from '../utils/auction';

import AvailablePlayersPanel from '../components/AvailablePlayersPanel/AvailablePlayersPanel';
import AuctionPanel from '../components/AuctionPanel/AuctionPanel';
import UnsoldPlayersPanel from '../components/UnsoldPlayersPanel/UnsoldPlayersPanel';
import TeamsPanel from '../components/TeamsPanel/TeamsPanel';

function AuctionDashboard() {
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>(initialPlayers);
  const [unsoldPlayers, setUnsoldPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<TeamWithPlayers[]>(initialTeams);

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentBidCr, setCurrentBidCr] = useState<number | null>(null);
  const [currentBidTeamId, setCurrentBidTeamId] = useState<string | null>(null);

  const isPlayerInAuction = useMemo(
    () => (playerId: string) => currentPlayer?.id === playerId,
    [currentPlayer]
  );

  const handleStartAuctionForPlayer = (playerId: string) => {
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

  const handleSellPlayer = () => {
    if (!currentPlayer || currentBidCr == null || !currentBidTeamId) return;

    setAvailablePlayers((prev) => prev.filter((p) => p.id !== currentPlayer.id));

    setTeams((prev) => movePlayerToTeam(prev, currentPlayer, currentBidTeamId, currentBidCr));

    setCurrentPlayer(null);
    setCurrentBidCr(null);
    setCurrentBidTeamId(null);
  };

  const handleMarkUnsold = () => {
    if (!currentPlayer) return;

    setAvailablePlayers((prev) => prev.filter((p) => p.id !== currentPlayer.id));

    setUnsoldPlayers((prev) => [
      ...prev,
      {
        ...currentPlayer,
        status: 'unsold',
      },
    ]);

    setCurrentPlayer(null);
    setCurrentBidCr(null);
    setCurrentBidTeamId(null);
  };

  const handleClearAuction = () => {
    setCurrentPlayer(null);
    setCurrentBidCr(null);
    setCurrentBidTeamId(null);
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-title">
          <h1>IPL 2026 Auction</h1>
          <p className="app-subtitle">
            Simulate the full IPL auction flow with live bidding, unsold players, and team squads.
          </p>
        </div>
        <div className="app-meta">
          <div className="meta-pill">
            <span className="meta-label">Players</span>
            <span className="meta-value">
              {availablePlayers.length + unsoldPlayers.length +
                teams.reduce((acc, t) => acc + t.players.length, 0)}
            </span>
          </div>
          <div className="meta-pill">
            <span className="meta-label">Teams</span>
            <span className="meta-value">{teams.length}</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="top-panels">
          <AvailablePlayersPanel
            players={availablePlayers}
            onStartAuction={handleStartAuctionForPlayer}
            isPlayerInAuction={isPlayerInAuction}
          />

          <AuctionPanel
            currentPlayer={currentPlayer}
            currentBidCr={currentBidCr}
            teams={teams}
            currentBidTeamId={currentBidTeamId}
            onBid={handleTeamBid}
            onSell={handleSellPlayer}
            onUnsold={handleMarkUnsold}
            onClear={handleClearAuction}
          />

          <UnsoldPlayersPanel players={unsoldPlayers} />
        </section>

        <section className="teams-section">
          <TeamsPanel
            teams={teams}
            currentPlayer={currentPlayer}
            currentBidCr={currentBidCr}
            currentBidTeamId={currentBidTeamId}
            onTeamBid={handleTeamBid}
          />
        </section>
      </main>
    </div>
  );
}

export default AuctionDashboard;

