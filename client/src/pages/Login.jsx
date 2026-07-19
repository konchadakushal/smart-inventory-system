import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

/**
 * Redesigned Login Page (Zoho-inspired Glassmorphism)
 * Features Indian enterprise branding, animated backgrounds, show/hide password,
 * error state validations, and keyboard support.
 */
const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  const from = location.state?.from?.pathname || '/';
  
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Check for expired session parameter in URL query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setError('Your session has expired. Please log in again.');
    }
  }, [location]);

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email address is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email address format.');
      return false;
    }
    if (!password) {
      setError('Password is required.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email, password);
      // Remember me handling (optional simulation)
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      if (err.message && err.message.includes('Network Error')) {
        setError('Server unavailable. Please check backend connection.');
      } else {
        setError('Incorrect email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    navigate('/forgot-password');
  };

  // Pre-fill email if remembered
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="login-container">
      {/* Premium Animated Background Shapes */}
      <div className="login-bg-glow bg-glow-1"></div>
      <div className="login-bg-glow bg-glow-2"></div>
      <div className="login-bg-glow bg-glow-3"></div>

      {/* Login Form Panel Card */}
      <div className="login-card-wrapper animate-slide-up">
        <div className="login-card">
          <div className="login-logo-header">
            {/* Box Logo with isometric lines */}
            <div className="logo-icon-box">
              <svg viewBox="0 0 24 24" className="logo-svg">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="logo-brand-text">LOGISMART</span>
            <p className="logo-tagline-text">Smart Warehouse & Inventory Management</p>
          </div>

          {error && (
            <div className="login-error-alert animate-fade-in">
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form-body">
            <div className="login-form-group">
              <label htmlFor="email">Email Address</label>
              <div className="login-input-container">
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

            <div className="login-form-group">
              <label htmlFor="password">Password</label>
              <div className="login-input-container password-container">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(prev => !prev)}
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password row */}
            <div className="login-form-row">
              <label className="remember-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span>Remember Me</span>
              </label>
              
              <a href="#forgot" className="forgot-pwd-link" onClick={handleForgotPassword}>
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="login-submit-button" disabled={loading}>
              {loading ? (
                <div className="submit-spinner">
                  <div className="dot1"></div>
                  <div className="dot2"></div>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-form-footer">
            <p>
              Don't have an account?{' '}
              <span className="create-account-link" onClick={() => navigate('/register')}>
                Create Account
              </span>
            </p>
          </div>
        </div>

        {/* Global Footer Trademark */}
        <footer className="login-global-footer">
          <p>© 2026 LOGISMART. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
