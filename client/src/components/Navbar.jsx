import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

/**
 * Navbar top header component.
 * Features a mobile menu trigger, breadcrumbs, theme toggle, and user profile shortcut.
 */
const Navbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isLight, setIsLight] = useState(localStorage.getItem('theme') === 'light');

  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLight]);

  // Determine current page title based on path
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'System Overview';
      case '/products':
        return 'Product Catalog';
      case '/suppliers':
        return 'Suppliers Registry';
      case '/stock':
        return 'Inventory & Stock Locations';
      case '/reports':
        return 'Audit Logs & Reports';
      case '/profile':
        return 'Account Profile';
      case '/settings':
        return 'System Settings';
      default:
        return 'Management Dashboard';
    }
  };

  // Generate breadcrumbs path
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return ['Dashboard', 'Overview'];
    
    const segment = path.substring(1);
    const capitalized = segment.charAt(0).toUpperCase() + segment.slice(1);
    return ['Dashboard', capitalized];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="navbar-header">
      <div className="navbar-left">
        {/* Hamburger Menu trigger for mobile */}
        <button className="mobile-menu-trigger" onClick={toggleSidebar} aria-label="Toggle Navigation Menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div>
          <h2 className="navbar-title">{getPageTitle()}</h2>
          <div className="breadcrumb-container">
            <span>{breadcrumbs[0]}</span>
            <span className="breadcrumb-separator">&rarr;</span>
            <span className="breadcrumb-active">{breadcrumbs[1]}</span>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {/* Date Display (Localized to Indian Standard) */}
        <div className="navbar-date">
          {new Date().toLocaleDateString('en-IN', { 
            weekday: 'short', 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          })}
        </div>

        {/* Theme Switcher Toggle */}
        <button 
          className="theme-toggle-btn" 
          onClick={() => setIsLight(!isLight)} 
          title="Toggle Light/Dark Theme"
          aria-label="Toggle Light/Dark Theme"
        >
          {isLight ? (
            /* Moon icon for Dark Mode trigger */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            /* Sun icon for Light Mode trigger */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>
        
        {/* User profile shortcut link */}
        <Link to="/profile" className="navbar-profile-shortcut">
          {user?.profile_picture ? (
            <img src={user.profile_picture} alt={user.username} className="avatar-img-mini" />
          ) : (
            <div className="avatar-mini">
              {user?.username?.substring(0, 2).toUpperCase() || 'OP'}
            </div>
          )}
          <span className="navbar-username">{user?.username || 'Operator'}</span>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
