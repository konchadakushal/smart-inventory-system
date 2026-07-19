import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Table from '../components/Table';
import { formatPhone, formatCurrency } from '../utils/format';
import './Suppliers.css';

/**
 * Supplier Management Page (Indian ERP Edition).
 * Tracks vendor registrations with GSTIN, PAN, localized phone and address fields, and supplied products.
 */
const Suppliers = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager' || isAdmin;

  // State lists
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSupplierId, setCurrentSupplierId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
    pan: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplyHistory, setSupplyHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Delete States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/suppliers');
      setSuppliers(response.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve suppliers list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Filter suppliers on client-side search query
  const filteredSuppliers = suppliers.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      (s.contact_name && s.contact_name.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.phone && s.phone.includes(term)) ||
      (s.gstin && s.gstin.toLowerCase().includes(term)) ||
      (s.pan && s.pan.toLowerCase().includes(term))
    );
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Supplier name is required';
    
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = 'Please enter a valid 10-digit Indian mobile number';
      }
    }

    if (formData.gstin.trim()) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(formData.gstin.toUpperCase())) {
        errors.gstin = 'Invalid GSTIN format (e.g. 36AAACL8890Q1ZX)';
      }
    }

    if (formData.pan.trim()) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(formData.pan.toUpperCase())) {
        errors.pan = 'Invalid PAN format (e.g. ABCDE1234F)';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      gstin: '',
      pan: ''
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (supplier, e) => {
    e.stopPropagation(); // Avoid opening details modal
    setIsEditMode(true);
    setCurrentSupplierId(supplier.id);
    setFormData({
      name: supplier.name,
      contact_name: supplier.contact_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      gstin: supplier.gstin || '',
      pan: supplier.pan || ''
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        gstin: formData.gstin ? formData.gstin.toUpperCase() : null,
        pan: formData.pan ? formData.pan.toUpperCase() : null
      };

      if (isEditMode) {
        await api.put(`/suppliers/${currentSupplierId}`, payload);
      } else {
        await api.post('/suppliers', payload);
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      setFormErrors({ submit: err.response?.data?.message || 'Failed to save supplier details.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Details Modal handler + Product supply list API call
  const openDetailModal = async (supplier) => {
    setSelectedSupplier(supplier);
    setDetailModalOpen(true);
    setLoadingHistory(true);
    try {
      const response = await api.get(`/suppliers/${supplier.id}/products`);
      setSupplyHistory(response.data.data);
    } catch (err) {
      console.error('Failed to load supplier product supply logs:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Delete Action Handlers
  const openDeleteModal = (supplier, e) => {
    e.stopPropagation(); // Avoid triggering details modal
    setSupplierToDelete(supplier);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/suppliers/${supplierToDelete.id}`);
      setDeleteModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete supplier record.');
    }
  };

  // Detail Modal Sub-Table headers
  const historyHeaders = [
    { key: 'sku', label: 'SKU / HSN', width: '25%', render: (row) => (
      <div>
        <span style={{ fontWeight: '600' }}>{row.sku}</span>
        {row.hsn_code && <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HSN: {row.hsn_code}</div>}
      </div>
    )},
    { key: 'name', label: 'Product Name', width: '35%' },
    { key: 'category_name', label: 'Category', width: '15%', render: (row) => row.category_name || 'General' },
    { 
      key: 'selling_price', 
      label: 'Selling Price (₹)', 
      width: '13%',
      render: (row) => formatCurrency(row.selling_price)
    },
    { key: 'total_stock', label: 'Stock', width: '12%', render: (row) => `${row.total_stock} ${row.unit || 'pcs'}` }
  ];

  return (
    <div className="suppliers-container animate-fade-in">
      {/* Toolbar Search Panel */}
      <div className="suppliers-toolbar">
        <div className="search-input-wrapper" style={{ flex: '0 1 360px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon-svg">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search suppliers by name, GSTIN, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isManager && (
          <button className="btn btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
            <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Supplier
          </button>
        )}
      </div>

      {error && <div style={{ color: 'var(--color-danger)', fontWeight: '600', marginBottom: '15px' }}>{error}</div>}

      {/* Grid of Supplier Cards */}
      {loading ? (
        <div className="suppliers-grid">
          {[1, 2, 3].map((skeletonIdx) => (
            <div key={skeletonIdx} className="supplier-card" style={{ animation: 'pulse 1.5s infinite ease-in-out', pointerEvents: 'none' }}>
              <div style={{ height: '40px', width: '40px', background: 'var(--bg-input)', borderRadius: 'var(--border-radius-md)' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, marginTop: '10px' }}>
                <div style={{ height: '16px', width: '140px', background: 'var(--bg-input)', borderRadius: 'var(--border-radius-sm)' }}></div>
                <div style={{ height: '12px', width: '80px', background: 'var(--bg-input)', borderRadius: 'var(--border-radius-sm)' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '40px' }}>
          No suppliers matching search found.
        </p>
      ) : (
        <div className="suppliers-grid">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="supplier-card" onClick={() => openDetailModal(supplier)}>
              <div className="supplier-card-header">
                <div className="supplier-avatar-mini">
                  {supplier.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="supplier-title-group">
                  <h4 className="supplier-name-heading">{supplier.name}</h4>
                  <span className="supplier-contact-name">
                    {supplier.contact_name || 'No Contact Person'}
                  </span>
                </div>
              </div>

              <div className="supplier-card-details">
                {supplier.phone && (
                  <div className="supplier-detail-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>{formatPhone(supplier.phone)}</span>
                  </div>
                )}
                
                {supplier.gstin && (
                  <div className="supplier-detail-row doc-info-row">
                    <span className="doc-label">GSTIN:</span>
                    <span className="doc-value">{supplier.gstin}</span>
                  </div>
                )}
                
                {supplier.pan && (
                  <div className="supplier-detail-row doc-info-row">
                    <span className="doc-label">PAN:</span>
                    <span className="doc-value">{supplier.pan}</span>
                  </div>
                )}
              </div>

              <div className="supplier-card-actions">
                <button className="details-link-btn" onClick={() => openDetailModal(supplier)}>
                  View Details &rarr;
                </button>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isManager && (
                    <button className="action-btn action-edit" onClick={(e) => openEditModal(supplier, e)} title="Edit Supplier">
                      <svg viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                      </svg>
                    </button>
                  )}
                  {isAdmin && (
                    <button className="action-btn action-delete" onClick={(e) => openDeleteModal(supplier, e)} title="Delete Supplier">
                      <svg viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal showing supplier summary and their product supply list */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Supplier Dashboard Profile"
      >
        {selectedSupplier && (
          <div className="supplier-profile-view animate-fade-in">
            <div className="supplier-summary-header">
              <div className="supplier-avatar-large">
                {selectedSupplier.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{selectedSupplier.name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                  Primary Contact: <strong>{selectedSupplier.contact_name || 'N/A'}</strong>
                </p>
              </div>
            </div>

            <div className="supplier-contact-grid">
              <div className="form-group">
                <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>{selectedSupplier.email || 'N/A'}</span>
              </div>
              <div className="form-group">
                <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>{formatPhone(selectedSupplier.phone)}</span>
              </div>
              <div className="form-group">
                <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GSTIN</span>
                <span style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: '700', marginTop: '4px' }}>{selectedSupplier.gstin || 'N/A'}</span>
              </div>
              <div className="form-group">
                <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PAN</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600', marginTop: '4px' }}>{selectedSupplier.pan || 'N/A'}</span>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Supplier Warehouse Address</span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: '1.4' }}>{selectedSupplier.address || 'N/A'}</span>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Supplied FMCG Products Catalog ({supplyHistory.length})
              </h4>
              <Table
                headers={historyHeaders}
                data={supplyHistory}
                loading={loadingHistory}
                emptyMessage="This vendor has no registered products in the system catalog."
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditMode ? 'Edit Supplier Record' : 'Register New Supplier Vendor'}
      >
        <form onSubmit={handleFormSubmit}>
          {formErrors.submit && (
            <div style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: '600', padding: '10px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(239, 68, 68, 0.15)', marginBottom: '15px' }}>
              {formErrors.submit}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Vendor Company Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Aashirvaad Distributors"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              {formErrors.name && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="contact_name">Primary Contact Name</label>
              <input
                id="contact_name"
                name="contact_name"
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={formData.contact_name}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gstin">GSTIN (15-Digit Identifier)</label>
              <input
                id="gstin"
                name="gstin"
                type="text"
                placeholder="e.g. 36AAACL8890Q1ZX"
                maxLength="15"
                value={formData.gstin}
                onChange={handleInputChange}
              />
              {formErrors.gstin && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.gstin}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="pan">PAN (10-Digit Card Number)</label>
              <input
                id="pan"
                name="pan"
                type="text"
                placeholder="e.g. ABCDE1234F"
                maxLength="10"
                value={formData.pan}
                onChange={handleInputChange}
              />
              {formErrors.pan && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.pan}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. dispatch@aashirvaad.in"
                value={formData.email}
                onChange={handleInputChange}
              />
              {formErrors.email && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number (Indian format) *</label>
              <input
                id="phone"
                name="phone"
                type="text"
                placeholder="e.g. +91 98765-43210"
                value={formData.phone}
                onChange={handleInputChange}
              />
              {formErrors.phone && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.phone}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Vendor HQ Office Address</label>
            <textarea
              id="address"
              name="address"
              rows="2"
              placeholder="Provide complete business address details..."
              value={formData.address}
              onChange={handleInputChange}
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Supplier Deletion"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
            Are you sure you want to delete supplier <strong>{supplierToDelete?.name}</strong>? 
            This action will disconnect this supplier reference from any associated products in the system.
          </p>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDeleteConfirm}>
              Delete Supplier
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Suppliers;
