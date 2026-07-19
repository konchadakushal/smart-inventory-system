import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

/**
 * System Settings View.
 * Displays application diagnostics and permits quick-toggling user roles for feature testing.
 */
const Settings = () => {
  const { user, register } = useAuth();

  return (
    <div className="settings-container animate-fade-in">
      <div className="settings-card">
        <h3 className="settings-section-title">Application Metadata</h3>
        <p className="settings-info-text">
          LogiSmart is an enterprise-grade Smart Inventory & Warehouse Management System designed with Node.js MVC architecture and React context engines.
        </p>
        
        <table style={{ width: '100%', fontSize: '13px', color: 'var(--text-secondary)', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 0', fontWeight: '600' }}>App Version</td>
              <td style={{ padding: '12px 0', textAlign: 'right' }}>v1.0.0 (Stable)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 0', fontWeight: '600' }}>Backend Framework</td>
              <td style={{ padding: '12px 0', textAlign: 'right' }}>Node.js / Express.js</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '12px 0', fontWeight: '600' }}>Database Engine</td>
              <td style={{ padding: '12px 0', textAlign: 'right' }}>MySQL 8.0 / mysql2 connection pool</td>
            </tr>
            <tr>
              <td style={{ padding: '12px 0', fontWeight: '600' }}>Frontend Library</td>
              <td style={{ padding: '12px 0', textAlign: 'right' }}>React 18 / Vite</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="settings-card">
        <h3 className="settings-section-title">Security & Role Configurations</h3>
        <p className="settings-info-text">
          Authentication is verified using signed JSON Web Tokens (JWT) containing cryptographically signed payloads. Access to actions is bounded by the following security groups:
        </p>

        <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li>
            <strong>Admin</strong>: Full system control, including product deletion, supplier removal, user management, and warehouse retirements.
          </li>
          <li>
            <strong>Manager</strong>: Can add/edit products, register suppliers, declare warehouses, adjust stock, and execute depot-to-depot transfers.
          </li>
          <li>
            <strong>Staff</strong>: Read-only catalog views, overview dashboards, audit logs, and profile checks.
          </li>
        </ul>

        <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px dashed rgba(245, 158, 11, 0.2)', borderRadius: 'var(--border-radius-md)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          <strong>Testing Roles:</strong> Log out and sign in using the following test accounts generated in <code>seed.sql</code>:
          <div style={{ marginTop: '8px', fontFamily: 'monospace' }}>
            - Admin: admin@smartinventory.com / admin123<br />
            - Manager: manager@smartinventory.com / admin123<br />
            - Staff: staff@smartinventory.com / admin123
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
