import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UsersIcon, TrophyIcon, ClockIcon } from '@heroicons/react/24/outline';
import './LandingPage.css';
import '../components/AuctionPanel/AuctionPanel.css';
import { headerTeamLogosLeft, headerTeamLogosRight } from '../data/headerFooterLogos';
import { initialTeams } from '../data/teams';
import TeamsPanel from '../components/TeamsPanel/TeamsPanel';
import FeaturedPlayersPanel from '../components/FeaturedPlayersPanel/FeaturedPlayersPanel';
import RulesModal from '../components/RulesModal/RulesModal';
import { headerFooterAssets } from '../data/headerFooterLogos';
import { buildApiUrl } from '../config/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [roomCode, setRoomCode] = useState('');
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsRoomId, setResultsRoomId] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showWhyLeague, setShowWhyLeague] = useState(false);

  const handleCreateRoom = useCallback(async () => {
    if (!name.trim() || creating) return;
    try {
      setCreating(true);
      const response = await fetch(buildApiUrl('/api/rooms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.error('Failed to create room', response.status);
        return;
      }
      const text = (await response.text()).trim();
      let id = text;
      if (text.startsWith('{') || text.startsWith('[') || text.startsWith('"')) {
        try {
          const parsed = JSON.parse(text);
          if (typeof parsed === 'string') {
            id = parsed;
          } else if (parsed && typeof parsed === 'object' && 'roomId' in parsed) {
            id = String((parsed as { roomId: string }).roomId);
          }
        } catch {
          id = text;
        }
      }

      const encodedName = encodeURIComponent(name.trim());
      // The creator of the room is always the auctioneer
      navigate(`/room/${id}?role=auctioneer&name=${encodedName}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating room', error);
    } finally {
      setCreating(false);
    }
  }, [name, creating, navigate]);

  const handleJoinRoom = useCallback(() => {
    if (!name.trim() || !roomCode.trim()) return;
    const encodedName = encodeURIComponent(name.trim());
    const trimmedCode = roomCode.trim();
    // Participants always join as participants, regardless of any prior role selection
    navigate(`/room/${trimmedCode}?role=participant&name=${encodedName}`);
  }, [name, roomCode, navigate]);

  const handleViewResults = useCallback(() => {
    if (!resultsRoomId.trim()) return;
    const trimmed = resultsRoomId.trim();
    navigate(`/results/${trimmed}`);
  }, [navigate, resultsRoomId]);

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
                <span className="app-title-main-icon" aria-hidden="true">
                  <TrophyIcon className="app-title-main-icon-svg" />
                </span>
              </h1>
            </div>
            <div className="app-header-teams app-header-teams--right">
              {headerTeamLogosRight.map((src, i) => (
                <img key={i} src={src} alt="" className="app-header-team-logo" />
              ))}
            </div>
          </div>
          <p className="app-subtitle">
           Build your squad in the mega auction. 1 auctioneer · 5–10 teams · 249 players · ₹120 Cr per team.
          </p>
          <div className="landing-header-btns">
            <button
              type="button"
              className="app-rules-btn landing-rules-btn-header"
              onClick={() => setShowWhyLeague(true)}
            >
              Why This League?
            </button>
            <button
              type="button"
              className="app-rules-btn landing-rules-btn-header"
              onClick={() => setShowRules(true)}
            >
              How to Play / Rules
            </button>
          </div>
        </div>
      </header>

      <main className="landing-main">
        <div className="landing-top-row-scroll">
          <div className="landing-top-row">
            <FeaturedPlayersPanel />

            <section className="panel-card landing-hero-card landing-hero-card--center">
            <div className="panel-header">
              <h2 className="panel-title landing-title-with-icon">
                <span className="landing-title-icon" aria-hidden="true">
                  <UsersIcon className="landing-title-icon-svg" />
                </span>
                <span>Play IPL Auction with Friends</span>
              </h2>
            </div>
            <p className="landing-subtitle">
              {/* Build your squad in the auction. 1 auctioneer · 5–10 teams · ₹120 Cr per team. */}
            </p>

            <div className="landing-form landing-form--compact">
              <button
                type="button"
                className="auction-start-btn landing-enter-btn"
                onClick={() => setShowRoomModal(true)}
              >
                <span className="auction-start-btn-icon" aria-hidden />
                ENTER THE AUCTION ROOM
              </button>
              <p className="landing-note">
                Create or join a private room to start a live fantasy auction.
              </p>
            </div>

            <div className="landing-meta">
              {/* <span>249 players</span>
              <span>25 sets</span>
              <span>₹120 Cr purse per team</span> */}
            </div>

            {showRoomModal && (
              <div className="room-modal-backdrop" onClick={() => setShowRoomModal(false)}>
                <div
                  className="room-modal"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="room-modal-header panel-header">
                    <h2 className="panel-title">Enter the auction room</h2>
                    <button
                      type="button"
                      className="room-modal-close"
                      onClick={() => setShowRoomModal(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  <div className="room-modal-tabs">
                    <button
                      type="button"
                      className={`room-modal-tab ${mode === 'create' ? 'room-modal-tab--active' : ''}`}
                      onClick={() => setMode('create')}
                    >
                      Create room
                    </button>
                    <button
                      type="button"
                      className={`room-modal-tab ${mode === 'join' ? 'room-modal-tab--active' : ''}`}
                      onClick={() => setMode('join')}
                    >
                      Join room
                    </button>
                  </div>
                  <div className="room-modal-body">
                    <label className="landing-label">
                      Your name
                      <input
                        type="text"
                        className="landing-input"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>

                    {mode === 'join' && (
                      <label className="landing-label">
                        Room ID
                        <input
                          type="text"
                          className="landing-input"
                          placeholder="Enter room ID shared by auctioneer"
                          value={roomCode}
                          onChange={(e) => setRoomCode(e.target.value)}
                        />
                      </label>
                    )}
                  </div>
                  <div className="room-modal-actions">
                    <button
                      type="button"
                      className="room-btn room-btn--secondary"
                      onClick={() => setShowRoomModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="room-btn room-btn--primary"
                      disabled={
                        !name.trim() ||
                        creating ||
                        (mode === 'join' && !roomCode.trim())
                      }
                      onClick={mode === 'create' ? handleCreateRoom : handleJoinRoom}
                    >
                      {mode === 'create'
                        ? creating
                          ? 'Creating room…'
                          : 'Create Room'
                        : 'Join Room'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

            <section className="panel-card landing-hero-card landing-hero-card--center landing-status-panel">
            <div className="panel-header">
              <h2 className="panel-title landing-panel-title-with-icon">
                <ClockIcon className="landing-panel-title-icon" />
                <span>Past Auctions</span>
              </h2>
            </div>
            <p className="landing-subtitle">
              Already finished the auction? Enter the auction room ID to see the squad you built.
            </p>
            <div className="landing-form landing-form--compact">
              <button
                type="button"
                className="landing-past-btn"
                onClick={() => setShowResultsModal(true)}
              >
                CHECK THE SQAUD YOU BUILT
              </button>
            </div>

            {showResultsModal && (
              <div
                className="landing-results-overlay"
                onClick={() => setShowResultsModal(false)}
              >
                <div
                  className="landing-results-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="room-modal-header">
                    <h2>Check the squad you built</h2>
                    <button
                      type="button"
                      className="room-modal-close"
                      onClick={() => setShowResultsModal(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                  <div className="room-modal-body">
                    <label className="landing-label">
                      Room ID
                      <input
                        type="text"
                        className="landing-input"
                        placeholder="Enter room ID to view results"
                        value={resultsRoomId}
                        onChange={(e) => setResultsRoomId(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="room-modal-actions">
                    <button
                      type="button"
                      className="room-btn room-btn--secondary"
                      onClick={() => setShowResultsModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="room-btn room-btn--primary"
                      disabled={!resultsRoomId.trim()}
                      onClick={handleViewResults}
                    >
                      View Results
                    </button>
                  </div>
                </div>
              </div>
            )}
            </section>
          </div>
        </div>

        <section className="landing-teams-preview">
          <TeamsPanel
            teams={initialTeams}
            auctionStarted={true}
            currentPlayer={null}
            currentBidCr={null}
            currentBidTeamId={null}
            onTeamBid={() => {}}
            onSellToTeam={() => {}}
            role="AUCTIONEER"
            myTeamId={null}
          />
        </section>
      </main>

      <RulesModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        iplMainLogoUrl={headerFooterAssets.iplMainLogo}
      />

      {showWhyLeague && (
        <div className="rules-modal-overlay" onClick={() => setShowWhyLeague(false)}>
          <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rules-modal-header">
              {headerFooterAssets.iplMainLogo && (
                <img src={headerFooterAssets.iplMainLogo} alt="IPL" className="rules-modal-ipl-logo" />
              )}
              <div className="rules-modal-header-row">
                <h2>Why This League?</h2>
                <button
                  type="button"
                  className="rules-modal-close"
                  onClick={() => setShowWhyLeague(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="rules-modal-body">
              <h3 className="why-league-heading">🚀 Why This League Is Better Than Regular Fantasy Apps</h3>
              <p>
                Most fantasy apps require daily participation. Before every match, managers must create a new team
                after the toss by picking players from the 22 players playing that match.
              </p>
              <p>
                Since the IPL has 70+ matches, this means managers must log in almost every day, analyze teams, and
                create a new lineup. For many people, this becomes difficult due to busy schedules.
              </p>
              <p><strong>Our IPL Fantasy Auction League solves this problem.</strong></p>

              <h3 className="why-league-heading">🏏 One Auction. One Squad. Full Season.</h3>
              <p>Instead of building a new team every match:</p>
              <ul className="why-league-list">
                <li>Managers participate in one mega auction before the tournament begins</li>
                <li>Each manager builds a full squad (16–25 players) from a pool of ~250 IPL players</li>
                <li>Your squad earns points automatically throughout the entire IPL season</li>
                <li>No need to pick teams daily</li>
                <li>Just watch the matches and track your players' performances</li>
              </ul>

              <h3 className="why-league-heading">🎯 Why It's More Fun</h3>
              <ul className="why-league-list">
                <li>💰 Realistic IPL-style auction experience</li>
                <li>🧠 Strategy matters – budget management and smart player selection</li>
                <li>⏳ No daily time commitment</li>
                <li>📊 Season-long competition</li>
                <li>🏆 Best squad across the entire IPL wins</li>
              </ul>

              <p className="why-league-footer">
                Think of it as owning your own IPL franchise for the whole season, rather than selecting a team every match.
              </p>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p className="app-footeropyright">
          © 2026 IPL. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;

