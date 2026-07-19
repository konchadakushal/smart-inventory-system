import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Table from '../components/Table';
import Modal from '../components/Modal';
import './Users.css';

/**
 * User Accounts Management Page (Admin Only).
 * CRUD operator logins, assign warehousing locations, toggle active/inactive status,
 * and perform administrative password overrides.
 */
const Users = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Staff',
    status: 'Active',
    warehouse_id: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Password reset modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    userId: null,
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [resetErrors, setResetErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user accounts catalog.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data.data);
    } catch (err) {
      console.error('Failed to load warehouses lookup list:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchWarehouses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateUserForm = () => {
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please provide a valid email format';
      }
    }
    if (!isEditMode && !formData.password) {
      errors.password = 'Initial password is required';
    } else if (!isEditMode && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddUserModal = () => {
    setIsEditMode(false);
    setSelectedUserId(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'Staff',
      status: 'Active',
      warehouse_id: ''
    });
    setFormErrors({});
    setUserModalOpen(true);
  };

  const openEditUserModal = (user) => {
    setIsEditMode(true);
    setSelectedUserId(user.id);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status,
      warehouse_id: user.warehouse_id || ''
    });
    setFormErrors({});
    setUserModalOpen(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!validateUserForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        warehouse_id: formData.warehouse_id ? parseInt(formData.warehouse_id, 10) : null
      };

      if (!isEditMode) {
        payload.password = formData.password;
        await api.post('/users', payload);
        showToast('User account created successfully!', 'success');
      } else {
        await api.put(`/users/${selectedUserId}`, payload);
        showToast('User account updated successfully!', 'success');
      }
      
      setUserModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      setFormErrors({ submit: err.response?.data?.message || 'Failed to save user details.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.id === currentUser.id) {
      showToast('You cannot delete your own account!', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user account '${user.username}'?`)) {
      try {
        await api.delete(`/users/${user.id}`);
        showToast('User account deleted successfully.', 'success');
        fetchUsers();
      } catch (err) {
        console.error(err);
        showToast(err.response?.data?.message || 'Deletion failed.', 'error');
      }
    }
  };

  const openResetModal = (user) => {
    setResetPasswordData({
      userId: user.id,
      username: user.username,
      password: '',
      confirmPassword: ''
    });
    setResetErrors({});
    setResetModalOpen(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetErrors({});
    
    if (!resetPasswordData.password) {
      setResetErrors({ password: 'Password is required' });
      return;
    }
    if (resetPasswordData.password.length < 6) {
      setResetErrors({ password: 'Password must be at least 6 characters' });
      return;
    }
    if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
      setResetErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/users/${resetPasswordData.userId}/reset-password`, {
        password: resetPasswordData.password
      });
      showToast(`Password overridden for operator '${resetPasswordData.username}'.`, 'success');
      setResetModalOpen(false);
    } catch (err) {
      console.error(err);
      setResetErrors({ submit: err.response?.data?.message || 'Password override failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter users by search input
  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term) ||
      (u.warehouse_name && u.warehouse_name.toLowerCase().includes(term))
    );
  });

  const usersHeaders = [
    { key: 'username', label: 'Username', width: '20%' },
    { key: 'email', label: 'Email', width: '25%' },
    { key: 'role', label: 'Access Role', width: '15%', render: (row) => (
      <span className={`badge ${row.role === 'Admin' ? 'badge-danger' : row.role === 'Manager' ? 'badge-warning' : 'badge-info'}`}>
        {row.role}
      </span>
    )},
    { key: 'warehouse', label: 'Assigned Depot', width: '20%', render: (row) => row.warehouse_name || 'All Warehouses' },
    { key: 'status', label: 'Status', width: '12%', render: (row) => (
      <span className={`badge ${row.status === 'Active' ? 'badge-success' : 'badge-secondary'}`}>
        {row.status}
      </span>
    )},
    { key: 'actions', label: 'Actions', width: '18%', render: (row) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => openEditUserModal(row)}
          style={{ padding: '6px 10px', fontSize: '11px' }}
        >
          Edit
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={() => openResetModal(row)}
          style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--color-primary)', borderColor: 'rgba(59, 130, 246, 0.2)' }}
        >
          Reset Pwd
        </button>
        {row.id !== currentUser.id && (
          <button 
            className="btn btn-secondary" 
            onClick={() => handleDeleteUser(row)}
            style={{ padding: '6px 10px', fontSize: '11px', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
          >
            Delete
          </button>
        )}
      </div>
    )}
  ];

  return (
    <div className="users-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Operator Accounts Directory</h1>
          <p className="page-subtitle">Configure system clear authorizations, warehouse duties, and statuses.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddUserModal}>
          + Register Operator
        </button>
      </div>

      <div className="filter-card" style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
        <div style={{ display: 'flex', gap: '16px', maxWidth: '400px' }}>
          <div style={{ flex: '1', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '14px' }}
            />
          </div>
        </div>
      </div>

      {error && <div style={{ color: 'var(--color-danger)', fontWeight: '600', marginBottom: '20px' }}>{error}</div>}

      <Table
        headers={usersHeaders}
        data={filteredUsers}
        loading={loading}
        emptyMessage="No operator accounts match your search filters."
      />

      {/* Register / Edit Operator Modal */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={isEditMode ? 'Modify Operator Account' : 'Register Operator Account'}
      >
        <form onSubmit={handleUserSubmit}>
          {formErrors.submit && (
            <div style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: '600', padding: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 'var(--border-radius-sm)', marginBottom: '15px' }}>
              {formErrors.submit}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="e.g. aditya_roy"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
            {formErrors.username && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="e.g. aditya@smartinventory.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            {formErrors.email && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.email}</span>}
          </div>

          {!isEditMode && (
            <div className="form-group">
              <label htmlFor="password">Initial Password *</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              {formErrors.password && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.password}</span>}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Access Role *</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="Staff">Staff</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Account Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive (Disabled)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="warehouse_id">Assigned Warehouse (Staff Duty)</label>
            <select
              id="warehouse_id"
              name="warehouse_id"
              value={formData.warehouse_id}
              onChange={handleInputChange}
            >
              <option value="">All / Unassigned (Headquarters)</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.warehouse_code})
                </option>
              ))}
            </select>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Assigning a warehouse restricts Staff role operators to view and adjust stock for that specific depot only.
            </p>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setUserModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Password Reset Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title={`Reset Password for '${resetPasswordData.username}'`}
      >
        <form onSubmit={handleResetSubmit}>
          {resetErrors.submit && (
            <div style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: '600', padding: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 'var(--border-radius-sm)', marginBottom: '15px' }}>
              {resetErrors.submit}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="resetPassword">New Password *</label>
            <input
              id="resetPassword"
              type="password"
              placeholder="••••••"
              value={resetPasswordData.password}
              onChange={(e) => setResetPasswordData(prev => ({ ...prev, password: e.target.value }))}
              required
            />
            {resetErrors.password && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{resetErrors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmResetPassword">Confirm New Password *</label>
            <input
              id="confirmResetPassword"
              type="password"
              placeholder="••••••"
              value={resetPasswordData.confirmPassword}
              onChange={(e) => setResetPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
            {resetErrors.confirmPassword && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{resetErrors.confirmPassword}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setResetModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Overriding...' : 'Override Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
