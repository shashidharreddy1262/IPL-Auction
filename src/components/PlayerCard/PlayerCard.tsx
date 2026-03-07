import React from 'react';
import './PlayerCard.css';
import type { Player } from '../../types';
import { formatPriceCr } from '../../utils/auction';

interface PlayerCardProps {
  player: Player;
  highlight?: boolean;
  onClick?: () => void;
  actionLabel?: string;
  disabled?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  highlight = false,
  onClick,
  actionLabel,
  disabled,
}) => {
  const showFooter = actionLabel != null;

  return (
    <div className={`player-card ${highlight ? 'player-card--highlight' : ''}`}>
      <div className="player-main">
        <div className="player-left">
          <div className="player-name">{player.name}</div>
          {player.franchise && <div className="player-franchise">{player.franchise}</div>}
          <div className="player-role">{player.role}</div>
        </div>
        <div className="player-right">
          <div className="player-meta">
            {player.country} · {player.capped === true ? 'Capped' : player.capped === false ? 'Uncapped' : '–'}
          </div>
          <div className="player-price">
            <span className="label">Base</span>
            <span className="value">{formatPriceCr(player.basePriceCr)}</span>
          </div>
        </div>
      </div>

      {showFooter && (
        <div className="player-footer">
          <button
            className="player-action-button"
            onClick={onClick ?? undefined}
            disabled={disabled}
            type="button"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerCard;

