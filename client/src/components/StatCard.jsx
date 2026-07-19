import React from 'react';
import './StatCard.css';

/**
 * StatCard component to show analytics metrics.
 * Supports loading states and accent styling.
 */
const StatCard = ({ title, value, icon, description, type = 'primary', loading = false }) => {
  if (loading) {
    return (
      <div className="stat-card skeleton">
        <div className="skeleton-title"></div>
        <div className="skeleton-value"></div>
        <div className="skeleton-desc"></div>
      </div>
    );
  }

  return (
    <div className={`stat-card border-${type}`}>
      <div className="stat-card-body">
        <div className="stat-card-info">
          <span className="stat-card-title">{title}</span>
          <h3 className="stat-card-value">{value}</h3>
          {description && <p className="stat-card-desc">{description}</p>}
        </div>
        {icon && <div className={`stat-card-icon color-${type}`}>{icon}</div>}
      </div>
    </div>
  );
};

export default StatCard;
