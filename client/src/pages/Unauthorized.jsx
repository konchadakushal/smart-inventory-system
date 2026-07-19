import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Unauthorized.css';

/**
 * Custom 403 Unauthorized Access View.
 * Displays warning info and provides quick link redirects back to the dashboard.
 */
const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="unauth-container animate-fade-in">
      <div className="unauth-card text-center">
        <div className="unauth-shield-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="22" x2="12" y2="2" />
            <circle cx="12" cy="12" r="3" fill="var(--color-danger)" style={{ opacity: 0.15 }} />
            <path d="M12 9v4M12 16h.01" stroke="var(--color-danger)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        
        <h1 className="unauth-title">403 - Access Restricted</h1>
        
        <p className="unauth-message">
          You do not have administrative clearance to access this module. 
          Your session and IP details have been recorded in the audit trail ledger.
        </p>

        <div className="unauth-actions">
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ padding: '12px 24px' }}>
            Back to Safety (Dashboard)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
