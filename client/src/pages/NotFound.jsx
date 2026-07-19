import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

/**
 * 404 Not Found Page.
 * Displayed for invalid URLs or unauthorized routes.
 */
const NotFound = () => {
  return (
    <div className="notfound-container">
      <div className="notfound-code">404</div>
      <h1 className="notfound-title">Page Not Found</h1>
      <p className="notfound-message">
        The page you are looking for does not exist, has been removed, or you do not have permission to access it.
      </p>
      <Link to="/" className="notfound-btn">
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
