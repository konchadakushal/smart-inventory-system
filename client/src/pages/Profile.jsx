import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

/**
 * User Profile view displaying details about the current authenticated user.
 */
const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="profile-container animate-fade-in">
      <div className="profile-grid">
        {/* Left column card: Avatar & Role */}
        <div className="profile-card">
          <div className="profile-avatar-large">
            {user?.username?.substring(0, 2).toUpperCase() || 'OP'}
          </div>
          <h3 className="profile-name">{user?.username || 'Operator'}</h3>
          <div className="profile-role-badge">
            <span className="badge badge-info">{user?.role || 'Staff'}</span>
          </div>
          
          <div className="profile-meta-details">
            <div className="profile-meta-item">
              <span className="profile-meta-label">User ID</span>
              <span className="profile-meta-value">#{user?.id || 'N/A'}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Permission Tier</span>
              <span className="profile-meta-value">{user?.role || 'Staff'} Access</span>
            </div>
          </div>
        </div>

        {/* Right column card: Extended Details */}
        <div className="profile-details-card">
          <h3 className="profile-section-title">Account Details</h3>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} onSubmit={(e) => e.preventDefault()}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Username</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    color: 'var(--text-secondary)',
                    cursor: 'not-allowed'
                  }}
                />
              </div>
              
              <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    color: 'var(--text-secondary)',
                    cursor: 'not-allowed'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>System Role</label>
              <input
                type="text"
                value={user?.role || ''}
                disabled
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  color: 'var(--text-secondary)',
                  cursor: 'not-allowed',
                  width: 'fit-content',
                  minWidth: '150px'
                }}
              />
            </div>

            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px dashed rgba(59, 130, 246, 0.2)', borderRadius: 'var(--border-radius-md)' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                <strong>Role Permissions Notice:</strong> As a <strong>{user?.role}</strong>, you have access to create and manage system operations. Profile changes must be requested through your system administrator.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
