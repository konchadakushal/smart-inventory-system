import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import './ResetPassword.css';

/**
 * Reset Password Page (Zoho-inspired Glassmorphism)
 * Accepts the reset token from query params, validates it,
 * and allows the user to securely set a new password.
 * Features a real-time password strength checklist.
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(true);
  const [tokenError, setTokenError] = useState('');
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password strength checklist states
  const strengthRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const isPasswordStrong = Object.values(strengthRules).every(rule => rule === true);

  // Extract and verify token on load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    
    if (!urlToken) {
      setTokenError('Missing password reset token. Please request a new link.');
      setVerifying(false);
      return;
    }

    setToken(urlToken);

    const verifyToken = async () => {
      try {
        const response = await api.get(`/auth/verify-reset-token?token=${urlToken}`);
        setEmail(response.data.data.email);
      } catch (err) {
        console.error(err);
        setTokenError(err.response?.data?.message || 'Invalid or expired password reset link.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isPasswordStrong) {
      setError('Password does not meet the complexity requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password,
        confirmPassword
      });

      setSuccess(response.data.message || 'Password updated successfully!');
      showToast('Password has been reset successfully! Please sign in.', 'success');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="reset-container">
        <div className="submit-spinner">
          <div className="dot1" style={{ width: '12px', height: '12px' }}></div>
          <div className="dot2" style={{ width: '12px', height: '12px', animationDelay: '-0.6s' }}></div>
        </div>
        <p style={{ color: '#94a3b8', marginTop: '15px', fontWeight: '500' }}>Verifying reset token...</p>
      </div>
    );
  }

  return (
    <div className="reset-container">
      {/* Background Glow Blobs */}
      <div className="reset-bg-glow bg-glow-1"></div>
      <div className="reset-bg-glow bg-glow-2"></div>
      <div className="reset-bg-glow bg-glow-3"></div>

      <div className="reset-card-wrapper animate-slide-up">
        <div className="reset-card">
          <div className="reset-logo-header">
            <div className="logo-icon-box">
              <svg viewBox="0 0 24 24" className="logo-svg">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="logo-brand-text">LOGISMART</span>
            <p className="logo-tagline-text">Reset Account Password</p>
          </div>

          {tokenError ? (
            <div className="token-error-view animate-fade-in">
              <div className="reset-error-alert">
                <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{tokenError}</span>
              </div>
              <button onClick={() => navigate('/forgot-password')} className="reset-submit-button">
                Request New Reset Link
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="reset-error-alert animate-fade-in">
                  <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="reset-success-alert animate-fade-in">
                  <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>{success} Redirecting to Sign In...</span>
                </div>
              )}

              {!success && (
                <form onSubmit={handleSubmit} className="reset-form-body">
                  <div className="user-email-badge">
                    Account: <strong>{email}</strong>
                  </div>

                  <div className="reset-form-group">
                    <label htmlFor="password">New Password</label>
                    <div className="reset-input-container">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="pwd-toggle-btn"
                        onClick={() => setShowPassword(prev => !prev)}
                        title={showPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Checklist visualizer */}
                  <div className="strength-checklist">
                    <span className="checklist-title">Password Complexity Checklist:</span>
                    <ul>
                      <li className={strengthRules.length ? 'checked' : 'unchecked'}>
                        <span className="bullet"></span> At least 8 characters long
                      </li>
                      <li className={strengthRules.uppercase ? 'checked' : 'unchecked'}>
                        <span className="bullet"></span> At least one uppercase letter (A-Z)
                      </li>
                      <li className={strengthRules.lowercase ? 'checked' : 'unchecked'}>
                        <span className="bullet"></span> At least one lowercase letter (a-z)
                      </li>
                      <li className={strengthRules.number ? 'checked' : 'unchecked'}>
                        <span className="bullet"></span> At least one numeric digit (0-9)
                      </li>
                      <li className={strengthRules.special ? 'checked' : 'unchecked'}>
                        <span className="bullet"></span> At least one special symbol (e.g. @, $, !, %, *, ?, &)
                      </li>
                    </ul>
                  </div>

                  <div className="reset-form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="reset-input-container">
                      <input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="reset-submit-button" 
                    disabled={loading || !isPasswordStrong || !confirmPassword}
                  >
                    {loading ? (
                      <div className="submit-spinner">
                        <div className="dot1"></div>
                        <div className="dot2"></div>
                      </div>
                    ) : (
                      'Save Password'
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="reset-form-footer">
            <p>
              Remember password?{' '}
              <span className="back-login-link" onClick={() => navigate('/login')}>
                Back to Sign In
              </span>
            </p>
          </div>
        </div>

        <footer className="reset-global-footer">
          <p>© 2026 LOGISMART. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default ResetPassword;
