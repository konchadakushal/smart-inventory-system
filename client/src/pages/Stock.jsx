import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { formatCurrency } from '../utils/format';
import './Stock.css';

/**
 * Stock & Locations View (Indian ERP Edition).
 * Manages storage depots (with codes and utilization progress bars), stock levels (with rack numbers),
 * and dispatches/intakes with PO and invoice reference codes.
 */
const Stock = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager' || isAdmin;

  // Warehouses state
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);

  // Active inventory state
  const [stock, setStock] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [error, setError] = useState('');

  // Dropdown options lists
  const [productsCatalog, setProductsCatalog] = useState([]);

  // Modals state
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [whFormData, setWhFormData] = useState({ name: '', location: '', capacity: '', warehouse_code: '' });
  const [whErrors, setWhErrors] = useState({});

  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjFormData, setAdjFormData] = useState({ product_id: '', quantity: '', type: 'IN', notes: '', rack_number: '', invoice_number: '', po_number: '' });
  const [adjErrors, setAdjErrors] = useState({});

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transFormData, setTransFormData] = useState({ product_id: '', to_warehouse_id: '', quantity: '', notes: '', rack_number: '', invoice_number: '', po_number: '' });
  const [transErrors, setTransErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);

  // Load all warehouses
  const fetchWarehouses = async (selectId = null) => {
    try {
      setLoadingWarehouses(true);
      const response = await api.get('/warehouses');
      const list = response.data.data;
      setWarehouses(list);
      
      // Auto select a warehouse on initial load or preserve selection
      if (list.length > 0) {
        if (selectId) {
          const match = list.find(w => w.id === selectId);
          setSelectedWarehouse(match || list[0]);
        } else if (!selectedWarehouse) {
          setSelectedWarehouse(list[0]);
        } else {
          const match = list.find(w => w.id === selectedWarehouse.id);
          setSelectedWarehouse(match || list[0]);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve warehouse locations.');
    } finally {
      setLoadingWarehouses(false);
    }
  };

  // Load stock inside the active warehouse
  const fetchStock = async () => {
    if (!selectedWarehouse) return;
    try {
      setLoadingStock(true);
      const response = await api.get(`/stock/warehouse/${selectedWarehouse.id}`);
      setStock(response.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load warehouse stock levels.');
    } finally {
      setLoadingStock(false);
    }
  };

  // Load product catalog option details for dropdown selects
  const fetchLookups = async () => {
    try {
      const prodRes = await api.get('/products?limit=100');
      setProductsCatalog(prodRes.data.data.products);
    } catch (err) {
      console.error('Failed to load product lookups:', err);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchStock();
  }, [selectedWarehouse]);

  // Capacity color class selector helper
  const getCapacityColorClass = (current, capacity) => {
    const pct = (current / capacity) * 100;
    if (pct >= 90) return 'fill-full';
    if (pct >= 75) return 'fill-warning';
    return 'fill-ok';
  };

  // --- WAREHOUSE CRUD HANDLERS ---
  const handleWhInputChange = (e) => {
    const { name, value } = e.target;
    setWhFormData(prev => ({ ...prev, [name]: value }));
    if (whErrors[name]) setWhErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateWarehouseForm = () => {
    const errors = {};
    if (!whFormData.name.trim()) errors.name = 'Warehouse name is required';
    if (!whFormData.warehouse_code.trim()) {
      errors.warehouse_code = 'Warehouse code is required';
    } else if (!/^[a-zA-Z0-9_\-]+$/.test(whFormData.warehouse_code)) {
      errors.warehouse_code = 'Code must be alphanumeric, hyphens or underscores';
    }
    if (!whFormData.location.trim()) errors.location = 'Warehouse address is required';
    if (!whFormData.capacity || isNaN(whFormData.capacity) || parseInt(whFormData.capacity, 10) <= 0) {
      errors.capacity = 'Capacity limit must be a positive integer';
    }
    setWhErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddWhModal = () => {
    setIsEditMode(false);
    setWhFormData({ name: '', location: '', capacity: '', warehouse_code: '' });
    setWhErrors({});
    setWarehouseModalOpen(true);
  };

  const openEditWhModal = () => {
    if (!selectedWarehouse) return;
    setIsEditMode(true);
    setWhFormData({
      name: selectedWarehouse.name,
      location: selectedWarehouse.location,
      capacity: selectedWarehouse.capacity,
      warehouse_code: selectedWarehouse.warehouse_code || ''
    });
    setWhErrors({});
    setWarehouseModalOpen(true);
  };

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    if (!validateWarehouseForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...whFormData,
        warehouse_code: whFormData.warehouse_code.toUpperCase(),
        capacity: parseInt(whFormData.capacity, 10)
      };

      let activeId = selectedWarehouse?.id;

      if (isEditMode) {
        const res = await api.put(`/warehouses/${selectedWarehouse.id}`, payload);
        activeId = res.data.data.id;
      } else {
        const res = await api.post('/warehouses', payload);
        activeId = res.data.data.id;
      }

      setWarehouseModalOpen(false);
      fetchWarehouses(activeId);
    } catch (err) {
      console.error(err);
      setWhErrors({ submit: err.response?.data?.message || 'Failed to save warehouse details.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWarehouse = async () => {
    if (!selectedWarehouse) return;
    if (confirm(`Are you sure you want to retire warehouse '${selectedWarehouse.name}'? This action is permanent.`)) {
      try {
        await api.delete(`/warehouses/${selectedWarehouse.id}`);
        setSelectedWarehouse(null);
        fetchWarehouses();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || 'Retiring warehouse failed.');
      }
    }
  };

  // --- STOCK ADJUSTMENT ADJUST (IN / OUT) HANDLERS ---
  const handleAdjInputChange = (e) => {
    const { name, value } = e.target;
    setAdjFormData(prev => ({ ...prev, [name]: value }));
    if (adjErrors[name]) setAdjErrors(prev => ({ ...prev, [name]: '' }));
  };

  const openAdjustmentModal = () => {
    setAdjFormData({
      product_id: productsCatalog[0]?.id || '',
      quantity: '',
      type: 'IN',
      notes: '',
      rack_number: '',
      invoice_number: '',
      po_number: ''
    });
    setAdjErrors({});
    setAdjustmentModalOpen(true);
  };

  const validateAdjustment = () => {
    const errors = {};
    if (!adjFormData.product_id) errors.product_id = 'Product selection is required';
    if (!adjFormData.quantity || isNaN(adjFormData.quantity) || parseInt(adjFormData.quantity, 10) <= 0) {
      errors.quantity = 'Quantity must be a positive integer';
    }
    setAdjErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    if (!validateAdjustment()) return;

    setSubmitting(true);
    try {
      const payload = {
        product_id: parseInt(adjFormData.product_id, 10),
        quantity: parseInt(adjFormData.quantity, 10),
        type: adjFormData.type,
        notes: adjFormData.notes,
        rack_number: adjFormData.rack_number || null,
        invoice_number: adjFormData.invoice_number ? adjFormData.invoice_number.toUpperCase() : null,
        po_number: adjFormData.po_number ? adjFormData.po_number.toUpperCase() : null,
        from_warehouse_id: adjFormData.type === 'OUT' ? selectedWarehouse.id : undefined,
        to_warehouse_id: adjFormData.type === 'IN' ? selectedWarehouse.id : undefined
      };

      await api.post('/stock/move', payload);
      setAdjustmentModalOpen(false);
      fetchWarehouses(selectedWarehouse.id);
      fetchStock();
    } catch (err) {
      console.error(err);
      setAdjErrors({ submit: err.response?.data?.message || 'Stock adjustment operation failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  // --- TRANSFER STOCK HANDLERS ---
  const handleTransInputChange = (e) => {
    const { name, value } = e.target;
    setTransFormData(prev => ({ ...prev, [name]: value }));
    if (transErrors[name]) setTransErrors(prev => ({ ...prev, [name]: '' }));
  };

  const openTransferModal = () => {
    setTransFormData({
      product_id: stock[0]?.product_id || '',
      to_warehouse_id: warehouses.find(w => w.id !== selectedWarehouse.id)?.id || '',
      quantity: '',
      notes: '',
      rack_number: '',
      invoice_number: '',
      po_number: ''
    });
    setTransErrors({});
    setTransferModalOpen(true);
  };

  const validateTransfer = () => {
    const errors = {};
    if (!transFormData.product_id) errors.product_id = 'Product selection is required';
    if (!transFormData.to_warehouse_id) errors.to_warehouse_id = 'Destination warehouse is required';
    if (!transFormData.quantity || isNaN(transFormData.quantity) || parseInt(transFormData.quantity, 10) <= 0) {
      errors.quantity = 'Quantity must be a positive integer';
    } else {
      const match = stock.find(s => s.product_id === parseInt(transFormData.product_id, 10));
      if (match && parseInt(transFormData.quantity, 10) > match.quantity) {
        errors.quantity = `Quantity exceeds current warehouse stock (${match.quantity} units available)`;
      }
    }
    setTransErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!validateTransfer()) return;

    setSubmitting(true);
    try {
      const payload = {
        product_id: parseInt(transFormData.product_id, 10),
        quantity: parseInt(transFormData.quantity, 10),
        type: 'TRANSFER',
        notes: transFormData.notes,
        rack_number: transFormData.rack_number || null,
        invoice_number: transFormData.invoice_number ? transFormData.invoice_number.toUpperCase() : null,
        po_number: transFormData.po_number ? transFormData.po_number.toUpperCase() : null,
        from_warehouse_id: selectedWarehouse.id,
        to_warehouse_id: parseInt(transFormData.to_warehouse_id, 10)
      };

      await api.post('/stock/move', payload);
      setTransferModalOpen(false);
      fetchWarehouses(selectedWarehouse.id);
      fetchStock();
    } catch (err) {
      console.error(err);
      setTransErrors({ submit: err.response?.data?.message || 'Stock transfer failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Table Headers config for Stock listings (Indian Localized)
  const stockHeaders = [
    { key: 'sku', label: 'SKU / Batch', width: '20%', render: (row) => (
      <div>
        <span style={{ fontWeight: '600' }}>{row.sku}</span>
        {row.batch_number && <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Batch: {row.batch_number}</div>}
      </div>
    )},
    { key: 'product_name', label: 'Product Name', width: '30%' },
    { key: 'category_name', label: 'Category', width: '15%', render: (row) => row.category_name || 'General' },
    { key: 'rack_number', label: 'Rack Placement', width: '15%', render: (row) => (
      <span className="rack-label">{row.rack_number || 'Floor Stock'}</span>
    )},
    { 
      key: 'pricing', 
      label: 'MRP & Sale', 
      width: '20%',
      render: (row) => (
        <div style={{ fontSize: '12px' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>MRP:</span> {formatCurrency(row.mrp)}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Sale:</span> {formatCurrency(row.selling_price)}</div>
        </div>
      )
    },
    { 
      key: 'quantity', 
      label: 'Quantity', 
      width: '12%',
      render: (row) => <strong>{row.quantity} {row.unit || 'pcs'}</strong>
    }
  ];

  return (
    <div className="stock-container animate-fade-in">
      {error && <div style={{ color: 'var(--color-danger)', fontWeight: '600', marginBottom: '15px' }}>{error}</div>}

      <div className="stock-layout">
        {/* Left column: Warehouses List */}
        <aside className="warehouses-column">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Depot Registry</h3>
            {isManager && (
              <button className="btn btn-secondary" onClick={openAddWhModal} style={{ padding: '6px 12px', fontSize: '12px' }}>
                + Add New
              </button>
            )}
          </div>

          {loadingWarehouses ? (
            [1, 2].map((idx) => (
              <div key={idx} className="warehouse-compact-card" style={{ animation: 'pulse 1.5s infinite ease-in-out', pointerEvents: 'none' }}>
                <div style={{ height: '14px', width: '120px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--border-radius-sm)' }}></div>
                <div style={{ height: '10px', width: '70px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--border-radius-sm)', marginTop: '4px' }}></div>
              </div>
            ))
          ) : warehouses.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No warehouses registered.</p>
          ) : (
            warehouses.map((w) => {
              const capPct = Math.min((parseInt(w.current_stock_count, 10) / parseInt(w.capacity, 10)) * 100, 100);
              return (
                <div
                  key={w.id}
                  className={`warehouse-compact-card ${selectedWarehouse?.id === w.id ? 'active' : ''}`}
                  onClick={() => setSelectedWarehouse(w)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="warehouse-compact-title">{w.name} ({w.warehouse_code})</span>
                  </div>
                  <span className="warehouse-compact-loc">{w.location}</span>
                  
                  {/* Miniature progress bar */}
                  <div className="capacity-progress-container">
                    <div className="capacity-progress-labels">
                      <span>Occupied: {Math.round(capPct)}%</span>
                      <span>{w.current_stock_count} / {w.capacity}</span>
                    </div>
                    <div className="capacity-progress-bar">
                      <div 
                        className={`capacity-progress-fill ${getCapacityColorClass(w.current_stock_count, w.capacity)}`}
                        style={{ width: `${capPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </aside>

        {/* Right column: Selected Warehouse Inventory Sheet */}
        <section className="inventory-column">
          {selectedWarehouse ? (
            <>
              {/* Warehouse Details Header panel */}
              <div className="inventory-header-panel">
                <div className="inventory-header-info">
                  <h3 className="inventory-header-title">{selectedWarehouse.name} ({selectedWarehouse.warehouse_code})</h3>
                  <span className="inventory-header-loc">Address: {selectedWarehouse.location}</span>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '10px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Total Stored Units: <strong>{selectedWarehouse.current_stock_count}</strong>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Maximum Capacity: <strong>{selectedWarehouse.capacity} units</strong>
                    </div>
                  </div>
                </div>

                <div className="inventory-action-group">
                  {isManager && (
                    <button className="btn btn-secondary" onClick={openEditWhModal} style={{ padding: '10px 16px' }}>
                      Edit Hub
                    </button>
                  )}
                  {isAdmin && (
                    <button className="btn btn-secondary" onClick={handleDeleteWarehouse} style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '10px 16px' }}>
                      Retire Hub
                    </button>
                  )}
                </div>
              </div>

              {/* Central Stock Adjustment Panel */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Stored Stock Catalog ({stock.length})
                </h3>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-primary" onClick={openAdjustmentModal} style={{ padding: '10px 16px' }}>
                    Adjust Stock
                  </button>
                  {isManager && (
                    <button 
                      className="btn btn-primary" 
                      onClick={openTransferModal} 
                      disabled={stock.length === 0 || warehouses.length < 2}
                      style={{ padding: '10px 16px' }}
                    >
                      Transfer Stock
                    </button>
                  )}
                </div>
              </div>

              {/* Stock List Table */}
              <Table
                headers={stockHeaders}
                data={stock}
                loading={loadingStock}
                emptyMessage="This warehouse is currently empty of stock. Click 'Adjust Stock' to receive items."
              />
            </>
          ) : (
            <div className="chart-fallback" style={{ height: '300px' }}>
              <span>Please select or add a warehouse location to view stock details.</span>
            </div>
          )}
        </section>
      </div>

      {/* --- MODALS SUB-FORMS --- */}
      
      {/* 1. Add / Edit Warehouse Modal */}
      <Modal
        isOpen={warehouseModalOpen}
        onClose={() => setWarehouseModalOpen(false)}
        title={isEditMode ? 'Edit Storage Depot' : 'Register Storage Depot'}
      >
        <form onSubmit={handleWarehouseSubmit}>
          {whErrors.submit && (
            <div style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: '600', padding: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 'var(--border-radius-sm)', marginBottom: '15px' }}>
              {whErrors.submit}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="wh_code">Depot Code *</label>
              <input
                id="wh_code"
                name="warehouse_code"
                type="text"
                placeholder="e.g. WH-HYD-01"
                value={whFormData.warehouse_code}
                onChange={handleWhInputChange}
                required
              />
              {whErrors.warehouse_code && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{whErrors.warehouse_code}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="wh_name">Warehouse Name *</label>
              <input
                id="wh_name"
                name="name"
                type="text"
                placeholder="e.g. Hyderabad Logistics Hub"
                value={whFormData.name}
                onChange={handleWhInputChange}
                required
              />
              {whErrors.name && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{whErrors.name}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="wh_location">Address Location *</label>
            <input
              id="wh_location"
              name="location"
              type="text"
              placeholder="e.g. Plot 47, Gachibowli Industrial Area, Hyderabad"
              value={whFormData.location}
              onChange={handleWhInputChange}
              required
            />
            {whErrors.location && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{whErrors.location}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="wh_capacity">Total Unit Capacity Limit *</label>
            <input
              id="wh_capacity"
              name="capacity"
              type="number"
              placeholder="5000"
              value={whFormData.capacity}
              onChange={handleWhInputChange}
              required
            />
            {whErrors.capacity && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{whErrors.capacity}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setWarehouseModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Hub'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Stock Adjustment (IN / OUT) Modal */}
      <Modal
        isOpen={adjustmentModalOpen}
        onClose={() => setAdjustmentModalOpen(false)}
        title={`Adjust Stock: ${selectedWarehouse?.name}`}
      >
        <form onSubmit={handleAdjustmentSubmit}>
          {adjErrors.submit && (
            <div style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: '600', padding: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 'var(--border-radius-sm)', marginBottom: '15px' }}>
              {adjErrors.submit}
            </div>
          )}

          <div className="form-row">
            <div className="form-group" style={{ flex: '1.5' }}>
              <label htmlFor="adj_product">Select Product *</label>
              <select
                id="adj_product"
                name="product_id"
                value={adjFormData.product_id}
                onChange={handleAdjInputChange}
                required
              >
                {productsCatalog.map((p) => (
                  <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                ))}
              </select>
              {adjErrors.product_id && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{adjErrors.product_id}</span>}
            </div>

            <div className="form-group" style={{ flex: '0.8' }}>
              <label htmlFor="adj_type">Direction *</label>
              <select
                id="adj_type"
                name="type"
                value={adjFormData.type}
                onChange={handleAdjInputChange}
              >
                <option value="IN">IN (Inward Intake)</option>
                <option value="OUT">OUT (Outward Dispatch)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="adj_quantity">Quantity (Units) *</label>
              <input
                id="adj_quantity"
                name="quantity"
                type="number"
                placeholder="e.g. 50"
                value={adjFormData.quantity}
                onChange={handleAdjInputChange}
                required
              />
              {adjErrors.quantity && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{adjErrors.quantity}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="adj_rack">Rack Placement Number</label>
              <input
                id="adj_rack"
                name="rack_number"
                type="text"
                placeholder="e.g. A-12-R2"
                value={adjFormData.rack_number}
                onChange={handleAdjInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="adj_invoice">Supplier Invoice Number</label>
              <input
                id="adj_invoice"
                name="invoice_number"
                type="text"
                placeholder="e.g. GST-8809"
                value={adjFormData.invoice_number}
                onChange={handleAdjInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="adj_po">Purchase Order (PO) Number</label>
              <input
                id="adj_po"
                name="po_number"
                type="text"
                placeholder="e.g. PO-2026-001"
                value={adjFormData.po_number}
                onChange={handleAdjInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="adj_notes">Operation Remarks / Notes</label>
            <input
              id="adj_notes"
              name="notes"
              type="text"
              placeholder="e.g. Stock shipment arrival from vendor"
              value={adjFormData.notes}
              onChange={handleAdjInputChange}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setAdjustmentModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Executing...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Transfer Stock Modal */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title={`Stock Transfer from: ${selectedWarehouse?.name}`}
      >
        <form onSubmit={handleTransferSubmit}>
          {transErrors.submit && (
            <div style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: '600', padding: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 'var(--border-radius-sm)', marginBottom: '15px' }}>
              {transErrors.submit}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="trans_product">Select Product to Move *</label>
            <select
              id="trans_product"
              name="product_id"
              value={transFormData.product_id}
              onChange={handleTransInputChange}
              required
            >
              {stock.map((s) => (
                <option key={s.product_id} value={s.product_id}>
                  [{s.sku}] {s.product_name} ({s.quantity} units available)
                </option>
              ))}
            </select>
            {transErrors.product_id && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{transErrors.product_id}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="trans_target">Destination Depot Hub *</label>
              <select
                id="trans_target"
                name="to_warehouse_id"
                value={transFormData.to_warehouse_id}
                onChange={handleTransInputChange}
                required
              >
                <option value="">-- Choose Hub --</option>
                {warehouses.filter(w => w.id !== selectedWarehouse.id).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Occupancy: {w.current_stock_count} / {w.capacity})
                  </option>
                ))}
              </select>
              {transErrors.to_warehouse_id && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{transErrors.to_warehouse_id}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="trans_rack">Dest. Rack Number</label>
              <input
                id="trans_rack"
                name="rack_number"
                type="text"
                placeholder="e.g. B-05-R1"
                value={transFormData.rack_number}
                onChange={handleTransInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="trans_quantity">Transfer Quantity (Units) *</label>
              <input
                id="trans_quantity"
                name="quantity"
                type="number"
                placeholder="e.g. 20"
                value={transFormData.quantity}
                onChange={handleTransInputChange}
                required
              />
              {transErrors.quantity && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{transErrors.quantity}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="trans_invoice">Inter-Depot Transfer Challan</label>
              <input
                id="trans_invoice"
                name="invoice_number"
                type="text"
                placeholder="e.g. CHN-HYD-5509"
                value={transFormData.invoice_number}
                onChange={handleTransInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="trans_notes">Transfer Purpose / Remarks</label>
            <input
              id="trans_notes"
              name="notes"
              type="text"
              placeholder="e.g. Rebalancing depot stock items"
              value={transFormData.notes}
              onChange={handleTransInputChange}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Executing Transfer...' : 'Confirm Transfer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Stock;
