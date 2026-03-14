import React, { useEffect } from 'react';
import './Toast.css';
import { formatPriceCr } from '../../utils/auction';

export type ToastType = 'sold' | 'unsold';

export interface ToastData {
  type: ToastType;
  playerName: string;
  teamName?: string;
  priceCr?: number;
}

interface ToastProps {
  data: ToastData;
  soldImageUrl?: string;
  unsoldImageUrl?: string;
  onDismiss: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  data,
  soldImageUrl,
  unsoldImageUrl,
  onDismiss,
  duration = 2000,
}) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  return (
    <div className={`toast toast--inline toast--${data.type}`} role="alert">
      {data.type === 'sold' && soldImageUrl && (
        <img src={soldImageUrl} alt="" className="toast-icon" />
      )}
      {data.type === 'unsold' && unsoldImageUrl && (
        <img src={unsoldImageUrl} alt="" className="toast-icon" />
      )}
      <div className="toast-content">
        {data.type === 'sold' && (
          <>
            <span className="toast-player">{data.playerName}</span>
            {data.teamName != null && (
              <span className="toast-detail">Sold to {data.teamName}</span>
            )}
            {data.priceCr != null && (
              <span className="toast-price">{formatPriceCr(data.priceCr)}</span>
            )}
          </>
        )}
        {data.type === 'unsold' && (
          <>
            <span className="toast-heading">UNSOLD</span>
            <span className="toast-detail">No bids received</span>
          </>
        )}
      </div>
    </div>
  );
};

export default Toast;
