import { useEffect, useMemo, useState } from 'react';
import './FeaturedPlayersPanel.css';
import PlayerCard from '../PlayerCard/PlayerCard';
import { FunnelIcon } from '@heroicons/react/24/outline';
import type { Player, PlayerFromApi } from '../../types';
import { buildApiUrl } from '../../config/api';

function normalizeRole(role: string | undefined): Player['role'] {
  const normalized = (role ?? '').trim();
  if (normalized === 'Batter') return 'Batsman';
  if (normalized === 'Wicket Keeper') return 'Wicket-Keeper';
  if (
    normalized === 'Batsman' ||
    normalized === 'Bowler' ||
    normalized === 'All-Rounder' ||
    normalized === 'Wicket-Keeper'
  ) {
    return normalized as Player['role'];
  }
  return 'Batsman';
}

function normalizePlayerFromApi(player: PlayerFromApi): Player {
  const explicitSetId = player.setId != null ? String(player.setId) : null;
  const setNumber = player.set_number ?? player.setNumber;
  const basePriceCr =
    typeof player.base_price_cr === 'number' && Number.isFinite(player.base_price_cr)
      ? player.base_price_cr
      : typeof player.basePriceCr === 'number' && Number.isFinite(player.basePriceCr)
        ? player.basePriceCr
        : 0;

  return {
    id: String(player.id ?? ''),
    name: String(player.name ?? ''),
    role: normalizeRole(player.role),
    country: String(player.country ?? ''),
    basePriceCr,
    status: 'available',
    setId:
      explicitSetId === 'reauction'
        ? 'reauction'
        : setNumber != null && Number.isFinite(setNumber)
          ? `set_${setNumber}`
          : (explicitSetId ?? 'set_1'),
    franchise: player.franchise != null ? String(player.franchise) : undefined,
    capped: player.capped === 1 || player.capped === true,
  };
}

const FeaturedPlayersPanel = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadPlayers = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl('/api/players'));
        if (!response.ok) return;
        const data = (await response.json()) as PlayerFromApi[];
        if (!cancelled) {
          setPlayers(Array.isArray(data) ? data.map((player) => normalizePlayerFromApi(player)) : []);
        }
      } catch {
        if (!cancelled) {
          setPlayers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPlayers();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = `${p.name} ${p.country} ${p.franchise} ${p.role}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [players, search]);

  return (
    <section className="panel-card landing-featured-panel available-panel">
      <div className="panel-header">
        <h2 className="panel-title landing-panel-title-with-icon">
          <FunnelIcon className="landing-panel-title-icon" />
          <span>Featured Players</span>
        </h2>
        <span className="panel-count">{filteredPlayers.length}</span>
      </div>

      <div className="landing-featured-filters">
        <input
          type="text"
          className="unsold-search landing-featured-filter-input"
          placeholder="Search name, team, role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="available-body landing-featured-body">
        <div className="available-list">
          {loading ? (
            <div className="landing-featured-empty">Loading players...</div>
          ) : filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => <PlayerCard key={player.id} player={player} />)
          ) : (
            <div className="landing-featured-empty">No players match these filters.</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedPlayersPanel;

