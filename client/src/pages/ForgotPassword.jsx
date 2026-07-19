import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './ForgotPassword.css';

/**
 * Forgot Password Page (Zoho-inspired Glassmorphism)
 * Prompts user to input their email and request a reset link.
 * If in development, displays the generated reset link inline.
 */
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email address is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDevResetUrl('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccess(response.data.message || 'If this email is registered, a password reset link has been generated.');
      
      // In development mode, the backend returns the devResetUrl in the payload
      if (response.data.data && response.data.data.devResetUrl) {
        setDevResetUrl(response.data.data.devResetUrl);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Something went wrong. Please verify your email exists and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      {/* Premium Animated Background Shapes */}
      <div className="forgot-bg-glow bg-glow-1"></div>
      <div className="forgot-bg-glow bg-glow-2"></div>
      <div className="forgot-bg-glow bg-glow-3"></div>

      <div className="forgot-card-wrapper animate-slide-up">
        <div className="forgot-card">
          <div className="forgot-logo-header">
            <div className="logo-icon-box">
              <svg viewBox="0 0 24 24" className="logo-svg">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="logo-brand-text">LOGISMART</span>
            <p className="logo-tagline-text">Password Recovery Portal</p>
          </div>

          {error && (
            <div className="forgot-error-alert animate-fade-in">
              <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="forgot-success-alert animate-fade-in">
              <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="forgot-form-body">
              <p className="forgot-helper-text">
                Enter your registered email address below. We'll send you a secure link to reset your password.
              </p>
              
              <div className="forgot-form-group">
                <label htmlFor="email">Email Address</label>
                <div className="forgot-input-container">
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <button type="submit" className="forgot-submit-button" disabled={loading}>
                {loading ? (
                  <div className="submit-spinner">
                    <div className="dot1"></div>
                    <div className="dot2"></div>
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          ) : (
            <div className="forgot-success-actions">
              {devResetUrl && (
                <div className="dev-banner animate-fade-in">
                  <span className="dev-badge">DEVELOPMENT MODE</span>
                  <p>Copy and use the reset link below to complete testing:</p>
                  <a href={devResetUrl} className="dev-link">
                    {devResetUrl}
                  </a>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(devResetUrl);
                      alert('Reset link copied to clipboard!');
                    }}
                    className="btn btn-secondary dev-copy-btn"
                  >
                    Copy Link
                  </button>
                </div>
              )}
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '10px' }}>
                Please check your inbox or use the development link to proceed.
              </p>
            </div>
          )}

          <div className="forgot-form-footer">
            <p>
              Remember your password?{' '}
              <span className="back-login-link" onClick={() => navigate('/login')}>
                Back to Sign In
              </span>
            </p>
          </div>
        </div>

        <footer className="forgot-global-footer">
          <p>© 2026 LOGISMART. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default ForgotPassword;
