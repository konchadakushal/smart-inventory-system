import React from 'react';
import './Toast.css';

/**
 * Toast Stack component.
 * Displays floating notification items.
 */
const Toast = ({ toasts, removeToast }) => {
  return (
    <div className="toast-portal-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.type} animate-slide-in`}>
          <div className="toast-icon-side">
            {t.type === 'success' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {t.type === 'error' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {t.type === 'warning' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
            {t.type === 'info' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            )}
          </div>
          
          <div className="toast-message-body">
            {t.message}
          </div>

          <button className="toast-dismiss-btn" onClick={() => removeToast(t.id)}>
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
