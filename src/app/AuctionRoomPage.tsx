import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import AuctionDashboard from './AuctionDashboard';
import { buildApiUrl } from '../config/api';

const MAX_PARTICIPANTS_PER_ROOM = 10;

const AuctionRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();

  const rawRole = searchParams.get('role');
  const role: 'AUCTIONEER' | 'PARTICIPANT' =
    rawRole && rawRole.toLowerCase() === 'auctioneer' ? 'AUCTIONEER' : 'PARTICIPANT';
  const nameFromQuery = searchParams.get('name');

  const initialTeamName = (() => {
    let initial = '';

    if (nameFromQuery && nameFromQuery.trim().length > 0) {
      try {
        initial = decodeURIComponent(nameFromQuery);
      } catch {
        initial = nameFromQuery;
      }
    } else if (roomId) {
      try {
        const stored = window.sessionStorage.getItem(`iplAuctionRoom:${roomId}:teamName`);
        if (stored && stored.trim().length > 0) {
          initial = stored;
        }
      } catch {
        // ignore storage errors
      }
    }

    return initial;
  })();

  const [teamName, setTeamName] = useState(initialTeamName);
  const [confirmed, setConfirmed] = useState(initialTeamName.trim().length > 0);
  const [joinedTeamsCount, setJoinedTeamsCount] = useState(0);
  const [checkingCapacity, setCheckingCapacity] = useState(role === 'PARTICIPANT');

  useEffect(() => {
    if (!roomId || role !== 'PARTICIPANT') {
      setCheckingCapacity(false);
      return;
    }

    let cancelled = false;

    const loadRoomCapacity = async () => {
      try {
        setCheckingCapacity(true);
        const response = await fetch(buildApiUrl(`/api/rooms/${roomId}/state`));
        if (!response.ok) return;
        const data = (await response.json()) as { teams?: Array<unknown> };
        if (!cancelled) {
          setJoinedTeamsCount(Array.isArray(data.teams) ? data.teams.length : 0);
        }
      } catch {
        if (!cancelled) {
          setJoinedTeamsCount(0);
        }
      } finally {
        if (!cancelled) setCheckingCapacity(false);
      }
    };

    loadRoomCapacity();
    return () => {
      cancelled = true;
    };
  }, [roomId, role]);

  const isRoomFull = useMemo(
    () => role === 'PARTICIPANT' && joinedTeamsCount >= MAX_PARTICIPANTS_PER_ROOM,
    [joinedTeamsCount, role]
  );

  if (!roomId) {
    return null;
  }

  return (
    <div className="app-root">
      {!confirmed && (
        <div className="room-modal-backdrop">
          <div
            className="room-modal"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="room-modal-header">
              <h2>Choose your team name</h2>
            </div>
            <div className="room-modal-body">
              <p className="landing-subtitle">
                This name will be used for your team in this room and will appear on the Teams panel.
              </p>
              {role === 'PARTICIPANT' && (
                <p className="landing-subtitle">
                  {checkingCapacity
                    ? 'Checking room capacity...'
                    : `Participants joined: ${joinedTeamsCount}/${MAX_PARTICIPANTS_PER_ROOM}`}
                </p>
              )}
              {isRoomFull && (
                <p className="landing-subtitle" style={{ color: '#fca5a5' }}>
                  This room already has the maximum 10 participants. No more participants can join.
                </p>
              )}
              <label className="landing-label">
                Team name
                <input
                  type="text"
                  className="landing-input"
                  placeholder="Enter your team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </label>
            </div>
            <div className="room-modal-actions">
              <button
                type="button"
                className="room-btn room-btn--primary"
                disabled={!teamName.trim() || checkingCapacity || isRoomFull}
                onClick={() => {
                  const trimmed = teamName.trim();
                  if (!trimmed || isRoomFull) return;
                  if (roomId) {
                    try {
                      window.sessionStorage.setItem(`iplAuctionRoom:${roomId}:teamName`, trimmed);
                    } catch {
                      // ignore storage errors
                    }
                  }
                  setTeamName(trimmed);
                  setConfirmed(true);
                }}
              >
                Enter room
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmed && (
        <AuctionDashboard
          roomId={roomId}
          role={role}
          userName={teamName.trim()}
        />
      )}
    </div>
  );
};

export default AuctionRoomPage;

