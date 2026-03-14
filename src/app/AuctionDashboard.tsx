import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../setupGlobals';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { DocumentDuplicateIcon, ShareIcon } from '@heroicons/react/24/outline';

import { initialTeams, TEAM_BUDGET_CR, CUSTOM_TEAM_COLORS } from '../data/teams';
import { auctionSets, selectedSetIdToPlayerSetId } from '../data/sets';
import type { Player, PlayerFromApi, TeamWithPlayers } from '../types';

import { canTeamBidForPlayer, getNextBid, MAX_PLAYERS_PER_TEAM } from '../utils/auction';

import AvailablePlayersPanel from '../components/AvailablePlayersPanel/AvailablePlayersPanel';
import AuctionPanel from '../components/AuctionPanel/AuctionPanel';
import UnsoldPlayersPanel from '../components/UnsoldPlayersPanel/UnsoldPlayersPanel';
import TeamsPanel from '../components/TeamsPanel/TeamsPanel';
import RulesModal from '../components/RulesModal/RulesModal';
import type { ToastData } from '../components/Toast/Toast';
import { headerFooterAssets, headerTeamLogosLeft, headerTeamLogosRight } from '../data/headerFooterLogos';
import { buildApiUrl } from '../config/api';

const TEAM_DEFAULTS_BY_KEY: Record<string, TeamWithPlayers> = initialTeams.reduce(
  (acc, team) => {
    const nameKey = team.name.toLowerCase();
    const shortKey = team.shortName.toLowerCase();
    acc[nameKey] = team;
    acc[shortKey] = team;
    return acc;
  },
  {} as Record<string, TeamWithPlayers>
);

/** Map backend role (Batter, Wicket Keeper) to frontend PlayerRole */
function normalizeRole(role: string | undefined): Player['role'] {
  const r = (role ?? '').trim();
  if (r === 'Batter') return 'Batsman';
  if (r === 'Wicket Keeper') return 'Wicket-Keeper';
  if (r === 'Batsman' || r === 'Bowler' || r === 'All-Rounder' || r === 'Wicket-Keeper') return r as Player['role'];
  return 'Batsman';
}

/** Normalize a player from /api/players (DB columns) to frontend Player. Supports camelCase (setNumber, setContains, basePriceCr) and snake_case. */
function normalizePlayerFromApi(p: PlayerFromApi): Player {
  const explicitSetId = p.setId != null ? String(p.setId) : null;
  const setNumber = p.set_number ?? p.setNumber;
  // If backend explicitly marks the player as "reauction", always honour that – don't let setNumber override it
  const setId =
    explicitSetId === 'reauction'
      ? 'reauction'
      : setNumber != null && Number.isFinite(setNumber)
        ? `set_${setNumber}`
        : (explicitSetId ?? 'set_1');
  const basePriceCr =
    typeof p.base_price_cr === 'number' && Number.isFinite(p.base_price_cr)
      ? p.base_price_cr
      : typeof p.basePriceCr === 'number' && Number.isFinite(p.basePriceCr)
        ? p.basePriceCr
        : 0;
  return {
    id: String(p.id ?? ''),
    name: String(p.name ?? ''),
    role: normalizeRole(p.role),
    country: String(p.country ?? ''),
    basePriceCr,
    status: 'available',
    setId,
    franchise: p.franchise != null ? String(p.franchise) : undefined,
    capped: p.capped === 1 || p.capped === true,
  };
}

/** Build auction sets from raw API players: unique set_number + set_contains from DB, plus Re-auction. Supports both snake_case and camelCase. */
function buildSetsFromApiPlayers(apiPlayers: PlayerFromApi[]): { id: string; name: string }[] {
  const bySetNumber = new Map<number, string>();
  for (const p of apiPlayers) {
    const n = p.set_number ?? (p as { setNumber?: number }).setNumber;
    const label = (p.set_contains ?? (p as { setContains?: string }).setContains ?? '').trim();
    if (n != null && Number.isFinite(n) && !bySetNumber.has(n)) {
      bySetNumber.set(n, label || `Set ${n}`);
    }
  }
  const setIds = Array.from(bySetNumber.keys()).sort((a, b) => a - b);
  const sets = setIds.map((n) => ({
    id: `set_${n}`,
    name: `Set ${n} – ${bySetNumber.get(n) ?? n}`,
  }));
  sets.push({ id: 'reauction', name: 'Re-auction (Unsold)' });
  return sets;
}

interface AuctionDashboardProps {
  roomId: string;
  role: 'AUCTIONEER' | 'PARTICIPANT';
  userName: string;
}

function AuctionDashboard({ roomId, role, userName }: AuctionDashboardProps) {
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const [roomStateLoaded, setRoomStateLoaded] = useState(false);
  const [unsoldPlayers, setUnsoldPlayers] = useState<Player[]>([]);
  // Start with no teams; they will be loaded from backend state to avoid flashing default 10 teams on refresh
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  /** Sets for Available Players dropdown: built from DB set_number + set_contains when players are loaded */
  const [auctionSetsFromData, setAuctionSetsFromData] = useState<{ id: string; name: string }[]>(() => [
    ...auctionSets,
  ]);
  const [selectedSetId, setSelectedSetId] = useState<string>(auctionSets[0]?.id ?? '');
  const [showRules, setShowRules] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [auctionStarted, setAuctionStarted] = useState(false);

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentBidCr, setCurrentBidCr] = useState<number | null>(null);
  const [currentBidTeamId, setCurrentBidTeamId] = useState<string | null>(null);
  const [selectedSellTeamId, setSelectedSellTeamId] = useState<string>('');
  const stompClientRef = useRef<Client | null>(null);
  const [isStompConnected, setIsStompConnected] = useState(false);
  /** Players loaded from /api/players; used when room state has empty availablePlayers so we don't overwrite */
  const playersFromApiRef = useRef<Player[]>([]);
  /** Latest availablePlayers for optimistic "Send to Auction" so we can find the player when clicking */
  const availablePlayersRef = useRef<Player[]>([]);
  /** Tracks playerIds that the auctioneer added back to pool – ensures setId:"reauction" survives backend state replace */
  const reauctionIdsRef = useRef<Set<string>>(new Set());
  /** When participant places a bid, avoid overwriting with stale null from poll/state for a short window */
  const pendingBidRef = useRef<{ bidAmount: number; teamId: string; at: number } | null>(null);
  /** Track previous live player/current bid state so sold/unsold toasts can be shown from shared backend state */
  const currentPlayerRef = useRef<Player | null>(null);
  const currentBidCrRef = useRef<number | null>(null);
  const currentBidTeamIdRef = useRef<string | null>(null);
  const lastResolvedToastPlayerIdRef = useRef<string | null>(null);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);

  availablePlayersRef.current = availablePlayers;
  currentPlayerRef.current = currentPlayer;
  currentBidCrRef.current = currentBidCr;
  currentBidTeamIdRef.current = currentBidTeamId;

  type BackendAuctionStatus = 'NOT_STARTED' | 'RUNNING' | 'ENDED';

  interface BackendAuctionState {
    roomId?: string;
    auctionStatus: BackendAuctionStatus;
    currentPlayer?: Player | null;
    currentBid?: number | string | null;
    current_bid?: number | string | null;
    highestBidderTeamId?: string | null;
    highest_bidder_team_id?: string | null;
    availablePlayers?: Player[];
    unsoldPlayers?: Player[];
    teams?: TeamWithPlayers[];
  }

  const applyBackendState = useCallback(
    (state: BackendAuctionState) => {
      const rawAvailable = state.availablePlayers ?? [];
      // Normalize if backend sent API shape (setNumber/setContains) instead of frontend Player shape
      const nextAvailable =
        rawAvailable.length > 0 && (rawAvailable[0] as PlayerFromApi).setNumber != null
          ? (rawAvailable as PlayerFromApi[]).map((p) => normalizePlayerFromApi(p))
          : rawAvailable as Player[];
      const nextUnsold = state.unsoldPlayers ?? [];
      const rawTeams = state.teams ?? [];

      const nextTeams: TeamWithPlayers[] = rawTeams.map((team, index) => {
        const rawNameKey = team.name?.trim().toLowerCase();
        const rawShortKey = (team as any).shortName?.trim?.().toLowerCase?.();
        const defaults =
          (rawNameKey && TEAM_DEFAULTS_BY_KEY[rawNameKey]) ||
          (rawShortKey && TEAM_DEFAULTS_BY_KEY[rawShortKey]) ||
          undefined;

        const budgetCr =
          typeof team.budgetCr === 'number' && Number.isFinite(team.budgetCr)
            ? team.budgetCr
            : defaults?.budgetCr ?? TEAM_BUDGET_CR;

        const maxPlayers =
          typeof team.maxPlayers === 'number' && team.maxPlayers > 0
            ? team.maxPlayers
            : defaults?.maxPlayers ?? MAX_PLAYERS_PER_TEAM;

        let primaryColor = team.primaryColor;
        let secondaryColor = team.secondaryColor;

        if (!primaryColor || !secondaryColor) {
          if (defaults) {
            primaryColor = defaults.primaryColor;
            secondaryColor = defaults.secondaryColor;
          } else {
            const [primary, secondary] = CUSTOM_TEAM_COLORS[index % CUSTOM_TEAM_COLORS.length];
            primaryColor = primary;
            secondaryColor = secondary;
          }
        }

        return {
          ...defaults,
          ...team,
          budgetCr,
          maxPlayers,
          primaryColor,
          secondaryColor,
        };
      });

      // Full replace from backend: one source of truth. If backend doesn't preserve setId:"reauction",
      // restore it from the local ref so players added back to pool stay in the Re-auction set.
      const knownReauctionIds = reauctionIdsRef.current;
      const mergedAvailable =
        knownReauctionIds.size > 0
          ? nextAvailable.map((p) =>
              knownReauctionIds.has(p.id) && p.setId !== 'reauction' ? { ...p, setId: 'reauction' } : p
            )
          : nextAvailable;
      const previousPlayer = currentPlayerRef.current;
      const nextCurrentPlayer = state.currentPlayer ?? null;
      if (nextCurrentPlayer) {
        lastResolvedToastPlayerIdRef.current = null;
      }
      setAvailablePlayers(mergedAvailable);
      setUnsoldPlayers(state.auctionStatus === 'ENDED' ? [] : nextUnsold);
      setTeams(nextTeams);
      setCurrentPlayer(nextCurrentPlayer);
      const rawBid = state.currentBid ?? (state as any).current_bid ?? null;
      const bidFromState =
        rawBid != null && rawBid !== ''
          ? (typeof rawBid === 'number' ? rawBid : Number(rawBid))
          : null;
      const bidderIdFromState =
        state.highestBidderTeamId ?? (state as any).highest_bidder_team_id ?? null;
      const bidderIdStr =
        bidderIdFromState != null && bidderIdFromState !== ''
          ? String(bidderIdFromState)
          : null;
      const pending = pendingBidRef.current;
      const isRecentPendingBid =
        role === 'PARTICIPANT' && pending && Date.now() - pending.at < 5000;

      // Only overwrite bidder when backend actually sends one. When backend sends currentBid (e.g. base 2.0) but
      // highestBidderTeamId null (not processed yet), keep participant's optimistic bidder so "You are leading" sticks.
      if (bidderIdStr != null) {
        pendingBidRef.current = null;
        setCurrentBidTeamId(bidderIdStr);
        setCurrentBidCr(
          bidFromState != null && Number.isFinite(bidFromState) ? bidFromState : null
        );
      } else if (isRecentPendingBid && pending) {
        setCurrentBidTeamId(String(pending.teamId));
        setCurrentBidCr(pending.bidAmount);
      } else {
        setCurrentBidTeamId(null);
        setCurrentBidCr(
          bidFromState != null && Number.isFinite(bidFromState) ? bidFromState : null
        );
      }
      if (pending && Date.now() - pending.at >= 5000) {
        pendingBidRef.current = null;
      }
      setAuctionStarted(state.auctionStatus === 'RUNNING');

      // Show sold/unsold toast for everyone from backend-driven room state transition.
      if (
        previousPlayer &&
        !nextCurrentPlayer &&
        state.auctionStatus === 'RUNNING' &&
        lastResolvedToastPlayerIdRef.current !== String(previousPlayer.id)
      ) {
        const previousPlayerId = String(previousPlayer.id);
        const becameUnsold = nextUnsold.some((player) => String(player.id) === previousPlayerId);
        const soldTeam = nextTeams.find((team) =>
          team.players.some((player) => String(player.id) === previousPlayerId)
        );
        const soldPlayer = soldTeam?.players.find((player) => String(player.id) === previousPlayerId);

        if (becameUnsold) {
          lastResolvedToastPlayerIdRef.current = previousPlayerId;
          setToast({
            type: 'unsold',
            playerName: previousPlayer.name,
          });
        } else if (soldTeam) {
          lastResolvedToastPlayerIdRef.current = previousPlayerId;
          setToast({
            type: 'sold',
            playerName: soldPlayer?.name ?? previousPlayer.name,
            teamName: soldTeam.shortName || soldTeam.name,
            priceCr: soldPlayer?.soldPriceCr ?? currentBidCrRef.current ?? undefined,
          });
        }
      }

      // Try to discover this client's team by matching name (case-insensitive, trimmed)
      if (!myTeamId && userName.trim().length > 0 && nextTeams.length > 0) {
        const normalizedUser = userName.trim().toLowerCase();
        const mine = nextTeams.find((t) => t.name?.trim().toLowerCase() === normalizedUser);
        if (mine && mine.id != null) {
          setMyTeamId(String(mine.id));
        }
      }
    },
    [myTeamId, userName, role]
  );

  const loadInitialState = useCallback(async () => {
    try {
      // Always load players from /api/players so backend DB is the source of truth
      const playersResponse = await fetch(buildApiUrl('/api/players'));
      if (playersResponse.ok) {
        const playersData = (await playersResponse.json()) as PlayerFromApi[];
        const normalized = playersData.map((p) => normalizePlayerFromApi(p));
        playersFromApiRef.current = normalized;
        const setsFromApi = buildSetsFromApiPlayers(playersData);
        // Only use API-built sets when we got at least one numbered set (Set 1, Set 2, …); otherwise keep static Set 1–Set 25 so dropdown shows options
        const useApiSets = setsFromApi.length > 1;
        setAuctionSetsFromData(useApiSets ? setsFromApi : auctionSets);
        setAvailablePlayers(normalized);
        setSelectedSetId((prev) => {
          const list = useApiSets ? setsFromApi : auctionSets;
          const firstId = list[0]?.id ?? '';
          const stillValid = list.some((s) => s.id === prev);
          return stillValid ? prev : firstId;
        });
      } else {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch players from /api/players', playersResponse.status);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching players from /api/players', error);
    }

    try {
      const response = await fetch(buildApiUrl(`/api/rooms/${roomId}/state`));
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch room state', response.status);
        return;
      }
      const data = (await response.json()) as BackendAuctionState;
      applyBackendState(data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching room state', error);
    } finally {
      setPlayersLoaded(true);
      setRoomStateLoaded(true);
    }
  }, [roomId, applyBackendState]);

  const fetchRoomState = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/rooms/${roomId}/state`));
      if (!response.ok) return;
      const data = (await response.json()) as BackendAuctionState;
      applyBackendState(data);
    } catch {
      // ignore polling errors
    }
  }, [roomId, applyBackendState]);

  useEffect(() => {
    if (!playersLoaded) {
      loadInitialState();
    }
  }, [playersLoaded, loadInitialState]);

  useEffect(() => {
    if (role !== 'PARTICIPANT' || !roomId) return;
    fetchRoomState();
    const interval = setInterval(fetchRoomState, 1000);
    return () => clearInterval(interval);
  }, [role, roomId, fetchRoomState]);

  useEffect(() => {
    if (role !== 'PARTICIPANT') return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchRoomState();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [role, fetchRoomState]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(buildApiUrl('/ws')),
      reconnectDelay: 5000,
      debug: () => {
        // quiet in production; uncomment for debugging
        // console.log(message);
      },
    });

    client.onConnect = () => {
      // Subscribe to full state updates (same payload as GET /api/rooms/:id/state). applyBackendState does full replace.
      client.subscribe(`/topic/room/${roomId}/state`, (message: IMessage) => {
        try {
          const body = JSON.parse(message.body) as BackendAuctionState;
          applyBackendState(body);
        } catch {
          // eslint-disable-next-line no-console
          console.error('Failed to parse state message', message.body);
        }
      });

      // Subscribe to bid-only updates (optional optimization)
      client.subscribe(`/topic/room/${roomId}/bid`, (message: IMessage) => {
        try {
          const body = JSON.parse(message.body) as {
            currentBid?: number | string | null;
            current_bid?: number | string | null;
            highestBidderTeamId?: string | null;
            highest_bidder_team_id?: string | null;
            teamId?: string | null;
          };
          const rawBid = body.currentBid ?? body.current_bid ?? null;
          const bid =
            rawBid != null && rawBid !== ''
              ? (typeof rawBid === 'number' ? rawBid : Number(rawBid))
              : null;
          const rawTeamId =
            body.highestBidderTeamId ?? body.highest_bidder_team_id ?? body.teamId ?? null;
          const teamId =
            rawTeamId != null && rawTeamId !== '' ? String(rawTeamId) : null;
          const hasFullBidUpdate = (bid != null && Number.isFinite(bid)) && teamId != null;
          if (hasFullBidUpdate) {
            setCurrentBidCr(bid);
            setCurrentBidTeamId(teamId);
            pendingBidRef.current = null;
          } else if (bid != null && Number.isFinite(bid) && teamId == null) {
            setCurrentBidCr(bid);
          } else if (teamId != null) {
            setCurrentBidTeamId(teamId);
            pendingBidRef.current = null;
          }
        } catch {
          // eslint-disable-next-line no-console
          console.error('Failed to parse bid message', message.body);
        }
      });

      // Join room to receive current state
      client.publish({
        destination: `/app/rooms/${roomId}/join`,
        body: JSON.stringify({ roomId, displayName: userName, role }),
      });
    };

    client.onStompError = (frame) => {
      // eslint-disable-next-line no-console
      console.error('Broker reported error: ', frame.headers['message'], frame.body);
    };

    stompClientRef.current = client;
    client.activate();

    return () => {
      setIsStompConnected(false);
      client.deactivate();
      stompClientRef.current = null;
    };
  }, [roomId, role, userName, applyBackendState]);

  const handleCopyRoomLink = useCallback(() => {
    if (!roomId) return;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/room/${roomId}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).catch(() => {
        // ignore clipboard errors
      });
    }
  }, [roomId]);

  const handleShareWhatsApp = useCallback(() => {
    if (!roomId) return;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/room/${roomId}`;
    const message = `Join my IPL Fantasy Auction room: ${roomId}\n${link}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [roomId]);

  const availableInSelectedSet = useMemo(() => {
    if (!selectedSetId) return availablePlayers;
    const playerSetId = selectedSetIdToPlayerSetId[selectedSetId] ?? selectedSetId;
    // When using static sets (set1, set2) also match API-style setId (set_1, set_2)
    const staticMatch = selectedSetId.match(/^set(\d+)$/);
    const idsToMatch =
      staticMatch ? [playerSetId, `set_${staticMatch[1]}`] : [playerSetId];
    return availablePlayers.filter((p) => idsToMatch.includes(p.setId));
  }, [availablePlayers, selectedSetId]);

  const selectedSet = auctionSetsFromData.find((s) => s.id === selectedSetId);
  const currentSetCompleted = auctionStarted && !currentPlayer && availableInSelectedSet.length === 0 && selectedSetId;

  const isPlayerInAuction = useMemo(
    () => (playerId: string) => currentPlayer?.id === playerId,
    [currentPlayer]
  );

  useEffect(() => {
    if (isStompConnected) setConnectionError(null);
  }, [isStompConnected]);

  useEffect(() => {
    if (currentBidTeamId) {
      setSelectedSellTeamId(currentBidTeamId);
    } else if (currentPlayer && teams.length > 0) {
      const firstAvailable = teams.find((t) => canTeamBidForPlayer(t));
      setSelectedSellTeamId((prev) => prev || firstAvailable?.id || teams[0]?.id || '');
    }
  }, [currentBidTeamId, currentPlayer, teams]);

  const publish = useCallback((destination: string, body: unknown): boolean => {
    const client = stompClientRef.current;
    if (!client || !client.connected) return false;
    client.publish({
      destination,
      body: JSON.stringify(body),
    });
    return true;
  }, []);

  const handleStartAuctionForPlayer = (playerId: string) => {
    if (role !== 'AUCTIONEER') return;
    const player = availablePlayersRef.current.find((p) => p.id === playerId);
    if (player) {
      setCurrentPlayer(player);
      setCurrentBidCr(null);
      setCurrentBidTeamId(null);
      setAvailablePlayers((prev) => prev.filter((p) => p.id !== playerId));
    }
    // Once sent to auction, remove from reauction tracking
    reauctionIdsRef.current.delete(playerId);
    publish(`/app/rooms/${roomId}/select-player`, { roomId, playerId });
  };

  const handleTeamBid = (teamId: string) => {
    if (role !== 'PARTICIPANT') return;
    const effectiveTeamId = myTeamId || teamId;
    if (!currentPlayer || !effectiveTeamId) return;
    const base = currentPlayer.basePriceCr;
    // If no one has bid yet, first bid = base price; otherwise increment from current
    const nextBidAmount = getNextBid(currentBidTeamId ? currentBidCr : null, base);
    const sent = publish(`/app/rooms/${roomId}/place-bid`, {
      roomId,
      teamId: effectiveTeamId,
      bidAmount: nextBidAmount,
    });
    if (sent) {
      const teamIdStr = String(effectiveTeamId);
      pendingBidRef.current = { bidAmount: nextBidAmount, teamId: teamIdStr, at: Date.now() };
      setCurrentBidCr(nextBidAmount);
      setCurrentBidTeamId(teamIdStr);
    }
    setSelectedSellTeamId(effectiveTeamId);
  };

  const handleSellToTeam = (_teamId: string) => {
    if (role !== 'AUCTIONEER') return;
    publish(`/app/rooms/${roomId}/sell-player`, {});
  };

  const handleMarkUnsold = () => {
    if (role !== 'AUCTIONEER') return;
    const sent = publish(`/app/rooms/${roomId}/unsell-player`, { roomId });
    if (!sent) {
      setConnectionError('Not connected. Wait a moment and try again.');
      setTimeout(() => setConnectionError(null), 4000);
    }
  };

  const handleDismissToast = useCallback(() => {
    setToast(null);
  }, []);

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
    if (role !== 'AUCTIONEER') return;
    const player = unsoldPlayers.find((p) => p.id === playerId);
    if (!player) return;
    // Track this player as "reauction" so backend state replace preserves setId:"reauction"
    reauctionIdsRef.current = new Set([...reauctionIdsRef.current, playerId]);
    publish(`/app/rooms/${roomId}/add-back-to-pool`, { playerId });
    // Optimistic update; backend will broadcast full state on /topic/room/{roomId}/state
    setUnsoldPlayers((prev) => prev.filter((p) => p.id !== playerId));
    setAvailablePlayers((prev) => [...prev, { ...player, status: 'available' as const, setId: 'reauction' }]);
    setSelectedSetId('reauction');
  };

  const handleEndAuction = () => {
    if (role !== 'AUCTIONEER') return;
    publish(`/app/rooms/${roomId}/end`, {});
  };

  const handleStartAuctionClick = () => {
    if (role !== 'AUCTIONEER') return;
    // Optimistically mark auction as started so UI (sets & players) becomes available immediately.
    // Backend remains the source of truth and will sync the final status via WebSocket state updates.
    setAuctionStarted(true);
    publish(`/app/rooms/${roomId}/start`, {});
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
              <h1 className="app-title-main">
                <span className="app-title-main-base">IPL 2026</span>
                <span className="app-title-main-gradient">FANTASY</span>
                <span className="app-title-main-gradient">AUCTION</span>
              </h1>
            </div>
            <div className="app-header-teams app-header-teams--right">
              {headerTeamLogosRight.map((src, i) => (
                <img key={i} src={src} alt="" className="app-header-team-logo" />
              ))}
            </div>
          </div>
          <p className="app-subtitle">
            Room <strong>{roomId}</strong> · You are playing as <strong>{userName}</strong> ({role.toLowerCase()}).
          </p>
          <div className="app-header-actions">
            <div className="room-created">
              <div className="room-id-pill">
                <span className="room-id-dot" aria-hidden="true" />
                <span className="room-id-value">{roomId}</span>
              </div>
              <div className="room-share-buttons">
                <button
                  type="button"
                  className="room-btn room-btn--secondary"
                  onClick={handleCopyRoomLink}
                >
                  <DocumentDuplicateIcon className="room-btn-icon" aria-hidden="true" />
                  <span>Copy link</span>
                </button>
                <button
                  type="button"
                  className="room-btn room-btn--whatsapp"
                  onClick={handleShareWhatsApp}
                >
                  <ShareIcon className="room-btn-icon" aria-hidden="true" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
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
            sets={auctionSetsFromData}
            hasPlayerInAuction={!!currentPlayer}
            isAuctioneer={role === 'AUCTIONEER'}
          />

          <AuctionPanel
            auctionStarted={auctionStarted}
            roomStateLoaded={roomStateLoaded}
            onStartAuction={handleStartAuctionClick}
            isAuctioneer={role === 'AUCTIONEER'}
            connectionError={connectionError}
            currentPlayer={currentPlayer}
            currentBidCr={currentBidCr}
            teams={teams}
            currentBidTeamId={currentBidTeamId}
            selectedSellTeamId={selectedSellTeamId}
            onBid={handleTeamBid}
            onSellToTeam={handleSellToTeam}
            onUnsold={handleMarkUnsold}
            onEndAuction={handleEndAuction}
            selectedSetName={selectedSet?.name}
            currentSetCompleted={!!currentSetCompleted}
            toast={toast}
            onDismissToast={handleDismissToast}
            soldImageUrl={headerFooterAssets.auctionSoldIcon}
            unsoldImageUrl={headerFooterAssets.auctionSoldIcon}
            role={role}
            myTeamId={myTeamId}
          />

          <UnsoldPlayersPanel
            players={unsoldPlayers}
            onReAuctionAll={handleReAuctionUnsold}
            onAddBackToPool={handleAddUnsoldBackToPool}
            auctionStarted={auctionStarted}
            toastVisible={!!toast}
            isAuctioneer={role === 'AUCTIONEER'}
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
            role={role}
            myTeamId={myTeamId}
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

