import React, { useEffect } from 'react';
import './Toast.css';

export type ToastType = 'sold' | 'unsold';

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss, duration = 3500 }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  return (
    <div className={`toast toast--${type}`} role="alert">
      <span className="toast-message">{message}</span>
    </div>
  );
};

export default Toast;
