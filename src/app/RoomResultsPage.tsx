import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import './RoomResultsPage.css';
import { formatPriceCr } from '../utils/auction';
import { buildApiUrl } from '../config/api';

interface PlayerResultDto {
  id: string;
  name: string;
  role: string;
  basePriceCr: number | null;
  soldPriceCr: number | null;
}

interface TeamResultDto {
  id: number | string;
  name: string;
  purseRemainingCr: number;
  players: PlayerResultDto[];
}

interface RoomResultsDto {
  roomId: string;
  teams: TeamResultDto[];
}

const RoomResultsPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [data, setData] = useState<RoomResultsDto | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(buildApiUrl(`/api/rooms/${roomId}/results`));
        if (!res.ok) {
          setError(`Failed to load results (status ${res.status})`);
          return;
        }
        const json = (await res.json()) as RoomResultsDto;
        setData(json);
        if (json.teams && json.teams.length > 0) {
          setSelectedTeamId(json.teams[0].id);
        }
      } catch (e) {
        setError('Error loading results');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [roomId]);

  const selectedTeam = useMemo(
    () => data?.teams.find((t) => String(t.id) === String(selectedTeamId)) ?? null,
    [data, selectedTeamId]
  );

  const amountSpent = useMemo(() => {
    if (!selectedTeam) return 0;
    return selectedTeam.players.reduce((sum, p) => sum + (p.soldPriceCr ?? 0), 0);
  }, [selectedTeam]);

  if (!roomId) {
    return null;
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-inner">
          <p className="app-subtitle">
            Room <strong>{roomId}</strong> · Past auction results
          </p>
        </div>
      </header>

      <main className="results-main">
        {loading && <div className="results-loading">Loading results…</div>}
        {error && <div className="results-error">{error}</div>}

        {data && data.teams && data.teams.length > 0 && (
          <>
            <section className="results-teams-strip">
              {data.teams.map((team, index) => {
                const isActive = String(team.id) === String(selectedTeamId);
                return (
                  <button
                    key={team.id}
                    type="button"
                    className={`results-team-chip ${isActive ? 'results-team-chip--active' : ''}`}
                    onClick={() => setSelectedTeamId(team.id)}
                  >
                    <span className="results-team-chip-index">{index + 1}</span>
                    <span className="results-team-chip-name">{team.name}</span>
                  </button>
                );
              })}
            </section>

            {selectedTeam && (
              <section className="results-panel">
                <div className="results-summary">
                  <div className="results-summary-item">
                    <span className="label">Purse remaining</span>
                    <span className="value">{formatPriceCr(selectedTeam.purseRemainingCr)}</span>
                  </div>
                  <div className="results-summary-item">
                    <span className="label">Amount spent</span>
                    <span className="value">{formatPriceCr(amountSpent)}</span>
                  </div>
                  <div className="results-summary-item">
                    <span className="label">Players bought</span>
                    <span className="value">{selectedTeam.players.length}</span>
                  </div>
                </div>

                <div className="results-players">
                  <div className="results-players-header">
                    <span className="col-name">Player</span>
                    <span className="col-role">Role</span>
                    <span className="col-base">Base Price</span>
                    <span className="col-final">Final Bid</span>
                  </div>
                  {selectedTeam.players.length === 0 ? (
                    <div className="results-players-empty">No players bought for this team.</div>
                  ) : (
                    selectedTeam.players.map((p) => (
                      <div key={p.id} className="results-player-row">
                        <span className="col-name">{p.name}</span>
                        <span className="col-role">{p.role}</span>
                        <span className="col-base">{formatPriceCr(p.basePriceCr)}</span>
                        <span className="col-final">{formatPriceCr(p.soldPriceCr)}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {data && (!data.teams || data.teams.length === 0) && !loading && !error && (
          <div className="results-empty">No results found for this room.</div>
        )}
      </main>
    </div>
  );
};

export default RoomResultsPage;

