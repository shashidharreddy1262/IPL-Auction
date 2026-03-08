import React, { useState } from 'react';
import './TeamSetupModal.css';
import type { TeamWithPlayers } from '../../types';
import { initialTeams } from '../../data/teams';
import { buildCustomTeams, MAX_CUSTOM_TEAMS, MIN_CUSTOM_TEAMS } from '../../data/teams';

export type TeamSetupMode = 'default' | 'custom';

interface TeamSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (teams: TeamWithPlayers[]) => void;
  /** When true, modal is positioned inside parent (Auctioneer panel) and does not cover the header */
  embedded?: boolean;
}

const TeamSetupModal: React.FC<TeamSetupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  embedded = false,
}) => {
  const [step, setStep] = useState<'choose' | 'custom-count' | 'custom-names'>('choose');
  const [customCount, setCustomCount] = useState(MIN_CUSTOM_TEAMS);
  const [customNames, setCustomNames] = useState<string[]>(() =>
    Array.from({ length: MIN_CUSTOM_TEAMS }, () => '')
  );

  if (!isOpen) return null;

  const handleUseDefault = () => {
    onConfirm(initialTeams);
    onClose();
    resetState();
  };

  const handleUseCustom = () => {
    setStep('custom-count');
    setCustomCount(MIN_CUSTOM_TEAMS);
    setCustomNames(Array.from({ length: MIN_CUSTOM_TEAMS }, () => ''));
  };

  const handleCustomCountNext = () => {
    const n = Math.max(MIN_CUSTOM_TEAMS, Math.min(MAX_CUSTOM_TEAMS, customCount));
    setCustomCount(n);
    setCustomNames((prev) => {
      const next = Array.from({ length: n }, (_, i) => prev[i] ?? '');
      return next.slice(0, n);
    });
    setStep('custom-names');
  };

  const setCustomName = (index: number, value: string) => {
    setCustomNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleCustomSubmit = () => {
    const names = customNames.map((n, i) => (n.trim() || `Team ${i + 1}`));
    if (names.length < MIN_CUSTOM_TEAMS) return;
    const teams = buildCustomTeams(names);
    onConfirm(teams);
    onClose();
    resetState();
  };

  const resetState = () => {
    setStep('choose');
    setCustomCount(MIN_CUSTOM_TEAMS);
    setCustomNames(Array.from({ length: MIN_CUSTOM_TEAMS }, () => ''));
  };

  const handleBack = () => {
    if (step === 'custom-names') setStep('custom-count');
    else if (step === 'custom-count') setStep('choose');
  };

  const allCustomNamesFilled = customNames.every((n) => n.trim().length > 0);
  const isCountValid = customCount >= MIN_CUSTOM_TEAMS && customCount <= MAX_CUSTOM_TEAMS;

  return (
    <div
      className={`team-setup-overlay ${embedded ? 'team-setup-overlay--embedded' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="team-setup-title"
    >
      <div className="team-setup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="team-setup-header">
          <h2 id="team-setup-title">Select teams before starting the auction</h2>
          {step === 'choose' && (
            <button type="button" className="team-setup-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          )}
        </div>

        <div className="team-setup-body">
          {step === 'choose' && (
            <>
              <p className="team-setup-intro">Use the default 10 IPL teams or create custom teams (min 5, max 30).</p>
              <div className="team-setup-options">
                <button type="button" className="team-setup-option team-setup-option--default" onClick={handleUseDefault}>
                  <span className="team-setup-option-title">Use default teams</span>
                  <span className="team-setup-option-desc">10 IPL teams (MI, CSK, RCB, KKR, RR, SRH, DC, PBKS, GT, LSG)</span>
                </button>
                <button type="button" className="team-setup-option team-setup-option--custom" onClick={handleUseCustom}>
                  <span className="team-setup-option-title">Use custom teams</span>
                  <span className="team-setup-option-desc">Enter your own team names (5 to 30 teams)</span>
                </button>
              </div>
            </>
          )}

          {step === 'custom-count' && (
            <>
              <p className="team-setup-intro">How many teams? (min {MIN_CUSTOM_TEAMS}, max {MAX_CUSTOM_TEAMS})</p>
              <div className="team-setup-count-row">
                <input
                  type="number"
                  min={MIN_CUSTOM_TEAMS}
                  max={MAX_CUSTOM_TEAMS}
                  value={customCount}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v)) setCustomCount(Math.max(0, Math.min(MAX_CUSTOM_TEAMS, v)));
                  }}
                  className="team-setup-count-input"
                  aria-label="Number of teams"
                  autoComplete="off"
                />
              </div>
              <div className="team-setup-nav-row">
                <button type="button" className="team-setup-back" onClick={handleBack}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="team-setup-btn team-setup-btn--primary"
                  onClick={handleCustomCountNext}
                  disabled={!isCountValid}
                  title={!isCountValid && customCount < MIN_CUSTOM_TEAMS ? 'Minimum team size should be 5' : undefined}
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 'custom-names' && (
            <>
              <p className="team-setup-intro">Enter a name for each team</p>
              <div className="team-setup-names-list">
                {customNames.map((name, i) => (
                  <div key={i} className="team-setup-name-row">
                    <label className="team-setup-name-label">Team {i + 1}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setCustomName(i, e.target.value)}
                      placeholder="Enter team name"
                      className="team-setup-name-input"
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>
              <div className="team-setup-actions">
                <button type="button" className="team-setup-back" onClick={handleBack}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="team-setup-btn team-setup-btn--primary"
                  onClick={handleCustomSubmit}
                  disabled={!allCustomNamesFilled}
                >
                  Start auction with {customNames.length} teams
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamSetupModal;
