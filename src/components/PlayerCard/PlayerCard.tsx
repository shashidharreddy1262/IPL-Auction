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
  return (
    <div className={`player-card ${highlight ? 'player-card--highlight' : ''}`}>
      <div className="player-main">
        <div className="player-name-role">
          <div className="player-name">{player.name}</div>
          <div className="player-role">{player.role}</div>
        </div>
        <div className="player-country">{player.country}</div>
      </div>

      <div className="player-footer">
        <div className="player-price">
          <span className="label">Base</span>
          <span className="value">{formatPriceCr(player.basePriceCr)}</span>
        </div>
        {actionLabel && onClick && (
          <button
            className="player-action-button"
            onClick={onClick}
            disabled={disabled}
            type="button"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;

