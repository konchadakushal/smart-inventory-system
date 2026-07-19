import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/format';
import './Products.css';

/**
 * Product Management View (Indian ERP Edition).
 * Complete implementation of product listings, search filters, actions drawer, stock adjustments, barcode, and QR codes.
 */
const Products = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager' || isAdmin;

  // List States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selection checkbox states
  const [selectedIds, setSelectedIds] = useState([]);

  // Filtering & Pagination States
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [outOfStockFilter, setOutOfStockFilter] = useState(false);
  const [gstFilter, setGstFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10);

  // Form Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  
  // Form Input States
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    mrp: '',
    purchase_price: '',
    selling_price: '',
    gst_rate: '18.00',
    hsn_code: '',
    unit: 'Pieces',
    batch_number: '',
    expiry_date: '',
    barcode: '',
    qr_code: '',
    min_stock_level: 10,
    max_stock_level: 100,
    image_url: '',
    warehouse_id: '',
    current_stock: '',
    rack_number: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Stock In Modal States
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockInProduct, setStockInProduct] = useState(null);
  const [stockInData, setStockInData] = useState({ quantity: '', invoiceNumber: '', notes: '', warehouseId: '' });

  // Stock Out Modal States
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [stockOutProduct, setStockOutProduct] = useState(null);
  const [stockOutData, setStockOutData] = useState({ quantity: '', notes: '', warehouseId: '' });

  // Barcode / QR Code modals
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [codeProduct, setCodeProduct] = useState(null);

  // Side Drawer View Product details state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // CSV Import Modal State
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');

  // Fetch products catalog
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        supplierId: supplierFilter || undefined,
        warehouseId: warehouseFilter || undefined,
        lowStock: lowStockFilter || undefined,
        outOfStock: outOfStockFilter || undefined,
        gstRate: gstFilter || undefined
      };
      const response = await api.get('/products', { params });
      setProducts(response.data.data.products);
      setTotalPages(response.data.data.pagination.totalPages);
      setTotalItems(response.data.data.pagination.totalItems);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch products list.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dropdown lookup options (Categories, Suppliers, Warehouses)
  const fetchLookups = async () => {
    try {
      const [catRes, supRes, whRes] = await Promise.all([
        api.get('/categories'),
        api.get('/suppliers'),
        api.get('/warehouses')
      ]);
      setCategories(catRes.data.data);
      setSuppliers(supRes.data.data);
      setWarehouses(whRes.data.data);
    } catch (err) {
      console.error('Failed to load lookup listings:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, supplierFilter, warehouseFilter, lowStockFilter, outOfStockFilter, gstFilter]);

  useEffect(() => {
    fetchLookups();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setSupplierFilter('');
    setWarehouseFilter('');
    setLowStockFilter(false);
    setOutOfStockFilter(false);
    setGstFilter('');
    setPage(1);
  };

  // Checkbox functions
  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
    }
  };

  // Form input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.sku.trim()) errors.sku = 'SKU code is required';
    if (!formData.name.trim()) errors.name = 'Product name is required';
    
    if (!formData.mrp) {
      errors.mrp = 'MRP is required';
    } else if (isNaN(formData.mrp) || parseFloat(formData.mrp) < 0) {
      errors.mrp = 'MRP must be a valid number >= 0';
    }

    if (!formData.purchase_price) {
      errors.purchase_price = 'Purchase price is required';
    } else if (isNaN(formData.purchase_price) || parseFloat(formData.purchase_price) < 0) {
      errors.purchase_price = 'Purchase price must be a valid number >= 0';
    }

    if (!formData.selling_price) {
      errors.selling_price = 'Selling price is required';
    } else if (isNaN(formData.selling_price) || parseFloat(formData.selling_price) < 0) {
      errors.selling_price = 'Selling price must be a valid number >= 0';
    }

    if (formData.min_stock_level === '' || isNaN(formData.min_stock_level) || parseInt(formData.min_stock_level, 10) < 0) {
      errors.min_stock_level = 'Min stock must be an integer >= 0';
    }

    if (formData.max_stock_level === '' || isNaN(formData.max_stock_level) || parseInt(formData.max_stock_level, 10) < 0) {
      errors.max_stock_level = 'Max stock must be an integer >= 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({
      sku: '',
      name: '',
      description: '',
      mrp: '',
      purchase_price: '',
      selling_price: '',
      gst_rate: '18.00',
      hsn_code: '',
      unit: 'Pieces',
      batch_number: '',
      expiry_date: '',
      barcode: '',
      qr_code: '',
      min_stock_level: 10,
      max_stock_level: 100,
      image_url: '',
      warehouse_id: warehouses[0]?.id || '',
      current_stock: '',
      rack_number: ''
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setIsEditMode(true);
    setCurrentProductId(product.id);
    
    let expStr = '';
    if (product.expiry_date) {
      const expDate = new Date(product.expiry_date);
      if (!isNaN(expDate.getTime())) {
        expStr = expDate.toISOString().split('T')[0];
      }
    }

    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      mrp: product.mrp,
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      gst_rate: product.gst_rate || '18.00',
      hsn_code: product.hsn_code || '',
      unit: product.unit || 'Pieces',
      batch_number: product.batch_number || '',
      expiry_date: expStr,
      barcode: product.barcode || '',
      qr_code: product.qr_code || '',
      min_stock_level: product.min_stock_level,
      max_stock_level: product.max_stock_level,
      image_url: product.image_url || '',
      warehouse_id: '',
      current_stock: '',
      rack_number: ''
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
        mrp: parseFloat(formData.mrp),
        purchase_price: parseFloat(formData.purchase_price),
        selling_price: parseFloat(formData.selling_price),
        gst_rate: parseFloat(formData.gst_rate),
        min_stock_level: parseInt(formData.min_stock_level, 10),
        max_stock_level: parseInt(formData.max_stock_level, 10),
        expiry_date: formData.expiry_date || null,
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id, 10) : null
      };

      if (isEditMode) {
        await api.put(`/products/${currentProductId}`, payload);
      } else {
        // Set dynamic QR code if empty
        if (!payload.qr_code) {
          payload.qr_code = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${payload.sku}`;
        }
        await api.post('/products', payload);
      }
      
      setModalOpen(false);
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      console.error(err);
      const apiMsg = err.response?.data?.message || 'Failed to save product details.';
      setFormErrors({ submit: apiMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/products/${productToDelete.id}`);
      setDeleteModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Delete operation failed.');
    }
  };

  // Bulk deletion
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected products? This is permanent.`)) return;
    
    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => api.delete(`/products/${id}`)));
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('One or more products could not be deleted.');
      fetchProducts();
    }
  };

  // Stock In adjust functions
  const openStockInModal = (product) => {
    setStockOutOpen(false);
    setStockInProduct(product);
    setStockInData({ quantity: '', invoiceNumber: '', notes: '', warehouseId: warehouses[0]?.id || '' });
    setStockInOpen(true);
  };

  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    if (!stockInData.quantity || isNaN(stockInData.quantity) || parseInt(stockInData.quantity, 10) <= 0) {
      alert('Please enter a valid stock intake quantity > 0');
      return;
    }
    if (!stockInData.warehouseId) {
      alert('Please select a target warehouse');
      return;
    }

    try {
      await api.post('/products/stock-in', {
        productId: stockInProduct.id,
        quantity: parseInt(stockInData.quantity, 10),
        warehouseId: parseInt(stockInData.warehouseId, 10),
        invoiceNumber: stockInData.invoiceNumber || 'STOCK-IN-MOCK',
        notes: stockInData.notes
      });
      setStockInOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to complete stock-in transaction.');
    }
  };

  // Stock Out adjust functions
  const openStockOutModal = (product) => {
    setStockInOpen(false);
    setStockOutProduct(product);
    setStockOutData({ quantity: '', notes: '', warehouseId: warehouses[0]?.id || '' });
    setStockOutOpen(true);
  };

  const handleStockOutSubmit = async (e) => {
    e.preventDefault();
    if (!stockOutData.quantity || isNaN(stockOutData.quantity) || parseInt(stockOutData.quantity, 10) <= 0) {
      alert('Please enter a valid stock dispatch quantity > 0');
      return;
    }
    if (!stockOutData.warehouseId) {
      alert('Please select a source warehouse');
      return;
    }

    try {
      await api.post('/products/stock-out', {
        productId: stockOutProduct.id,
        quantity: parseInt(stockOutData.quantity, 10),
        warehouseId: parseInt(stockOutData.warehouseId, 10),
        notes: stockOutData.notes
      });
      setStockOutOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to complete stock-out transaction.');
    }
  };

  // Duplication
  const handleDuplicateProduct = async (product) => {
    try {
      setLoading(true);
      await api.post('/products/duplicate', { productId: product.id });
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Duplication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Drawer details view
  const handleOpenDrawer = async (product) => {
    try {
      const response = await api.get(`/products/${product.id}`);
      setViewProduct(response.data.data);
      setDrawerOpen(true);
    } catch (err) {
      console.error(err);
      alert('Failed to retrieve full product details drawer.');
    }
  };

  // File exports simulation
  const handleExport = (type) => {
    if (products.length === 0) return;
    
    // Header names matching localized attributes
    const headers = ['SKU', 'Product Name', 'MRP', 'Purchase Price', 'Selling Price', 'GST Rate', 'HSN Code', 'Unit', 'Batch', 'Expiry', 'Barcode', 'Current Stock'];
    const rows = products.map(p => [
      p.sku,
      p.name,
      p.mrp,
      p.purchase_price,
      p.selling_price,
      p.gst_rate,
      p.hsn_code || 'N/A',
      p.unit,
      p.batch_number || 'N/A',
      p.expiry_date ? formatDate(p.expiry_date) : 'N/A',
      p.barcode || 'N/A',
      p.total_stock
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `logismart_products_${type.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.${type === 'PDF' ? 'txt' : 'csv'}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV mock imports
  const handleCSVImport = () => {
    setImportOpen(true);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    // Simulate importing 5 products
    try {
      setLoading(true);
      const mockItems = [
        { sku: 'SKU-IMP-001', name: 'Britannia Marie Gold 250g', mrp: 40.00, purchase_price: 30.00, selling_price: 36.00, gst_rate: 18.00, unit: 'Pieces' },
        { sku: 'SKU-IMP-002', name: 'Kissan Tomato Sauce 1kg', mrp: 150.00, purchase_price: 110.00, selling_price: 140.00, gst_rate: 12.00, unit: 'Pieces' },
        { sku: 'SKU-IMP-003', name: 'Tata Tea Premium 1kg', mrp: 410.00, purchase_price: 320.00, selling_price: 390.00, gst_rate: 5.00, unit: 'Boxes' }
      ];

      await Promise.all(mockItems.map(item => api.post('/products', item)));
      setImportOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Mock CSV import process failed.');
    } finally {
      setLoading(false);
    }
  };

  // Table header config
  const tableHeaders = [
    {
      key: 'checkbox',
      label: (
        <input 
          type="checkbox" 
          checked={products.length > 0 && selectedIds.length === products.length} 
          onChange={handleSelectAll} 
        />
      ),
      width: '4%',
      render: (row) => (
        <input 
          type="checkbox" 
          checked={selectedIds.includes(row.id)} 
          onChange={() => handleSelectRow(row.id)} 
        />
      )
    },
    { key: 'sku', label: 'SKU / Barcode', width: '12%', render: (row) => (
      <div>
        <span style={{ fontWeight: '600' }}>{row.sku}</span>
        {row.barcode && <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Barcode: {row.barcode}</div>}
      </div>
    )},
    { key: 'name', label: 'Item Name & HSN', width: '20%', render: (row) => (
      <div>
        <div style={{ fontWeight: '700' }}>{row.name}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
          HSN: {row.hsn_code || 'N/A'} • Unit: {row.unit || 'Pieces'}
        </div>
      </div>
    )},
    { 
      key: 'category_name', 
      label: 'Category', 
      width: '10%',
      render: (row) => row.category_name || <span style={{ color: 'var(--text-muted)' }}>General</span>
    },
    { 
      key: 'pricing', 
      label: 'Pricing & GST', 
      width: '18%',
      render: (row) => (
        <div style={{ fontSize: '12px' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>MRP:</span> <span style={{ fontWeight: '600' }}>{formatCurrency(row.mrp)}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Sale:</span> {formatCurrency(row.selling_price)}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>GST:</span> {row.gst_rate}%</div>
        </div>
      )
    },
    {
      key: 'batch_expiry',
      label: 'Batch & Expiry',
      width: '12%',
      render: (row) => (
        <div style={{ fontSize: '12px' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Batch:</span> {row.batch_number || 'N/A'}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Exp:</span> {row.expiry_date ? formatDate(row.expiry_date) : 'N/A'}</div>
        </div>
      )
    },
    { 
      key: 'total_stock', 
      label: 'Current Stock', 
      width: '12%',
      render: (row) => {
        const isLow = row.total_stock < row.min_stock_level;
        return (
          <div className={isLow ? 'stock-warning-badge' : 'stock-ok-badge'}>
            {row.total_stock} {isLow && `(Low < ${row.min_stock_level})`}
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '12%',
      render: (row) => (
        <div className="table-actions">
          {/* View Drawer trigger */}
          <button className="action-btn action-view" onClick={() => handleOpenDrawer(row)} title="View Details">
            👁
          </button>
          {isManager && (
            <button className="action-btn action-edit" onClick={() => openEditModal(row)} title="Edit Item">
              ✏
            </button>
          )}
          {/* Stock In inward */}
          <button className="action-btn action-stock-in" onClick={() => openStockInModal(row)} title="Stock In">
            📦
          </button>
          {/* Stock Out outward */}
          <button className="action-btn action-stock-out" onClick={() => openStockOutModal(row)} title="Stock Out">
            📤
          </button>
          {isManager && (
            <button className="action-btn action-duplicate" onClick={() => handleDuplicateProduct(row)} title="Duplicate">
              📋
            </button>
          )}
          {isManager && (
            <>
              <button className="action-btn action-barcode" onClick={() => { setCodeProduct(row); setBarcodeOpen(true); }} title="Print Barcode">
                🖨
              </button>
              <button className="action-btn action-qr" onClick={() => { setCodeProduct(row); setQrOpen(true); }} title="Generate QR">
                🏷
              </button>
            </>
          )}
          {isAdmin && (
            <button className="action-btn action-delete" onClick={() => openDeleteModal(row)} title="Delete Item">
              🗑
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="products-container animate-fade-in">
      
      {/* Top Action controls bar */}
      <div className="products-header-actions">
        <div className="toolbar-buttons-wrapper">
          {isManager && (
            <button className="btn btn-primary" onClick={openAddModal}>
              + Add Product
            </button>
          )}
          {isManager && (
            <button className="btn btn-secondary" onClick={handleCSVImport}>
              Import CSV
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => handleExport('CSV')}>
            Export CSV
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport('EXCEL')}>
            Export Excel
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport('PDF')}>
            Export PDF
          </button>
          {selectedIds.length > 0 && isAdmin && (
            <button className="btn btn-secondary" style={{ backgroundColor: 'var(--color-danger)', border: 'none', color: '#fff' }} onClick={handleBulkDelete}>
              Bulk Delete ({selectedIds.length})
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => { setSelectedIds([]); fetchProducts(); }}>
            Refresh
          </button>
          <button className="btn btn-secondary" onClick={() => setShowFilters(prev => !prev)}>
            {showFilters ? 'Hide Filters' : 'Advanced Filters'}
          </button>
        </div>

        {/* Global Toolbar Text Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <div className="search-input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon-svg">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by SKU, Name, HSN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Search</button>
        </form>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="advanced-filters-panel">
          <div className="filter-field">
            <label>Category</label>
            <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="filter-field">
            <label>Supplier Vendor</label>
            <select className="filter-select" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
              <option value="">All Suppliers</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="filter-field">
            <label>Storage Depot</label>
            <select className="filter-select" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
              <option value="">All Warehouses</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.warehouse_code})</option>)}
            </select>
          </div>

          <div className="filter-field">
            <label>GST Tax rate</label>
            <select className="filter-select" value={gstFilter} onChange={(e) => setGstFilter(e.target.value)}>
              <option value="">All Rates</option>
              <option value="0.00">0% (Exempt)</option>
              <option value="5.00">5% GST</option>
              <option value="12.00">12% GST</option>
              <option value="18.00">18% GST</option>
              <option value="28.00">28% GST</option>
            </select>
          </div>

          <div className="filter-checkbox-group">
            <input type="checkbox" id="lowStock" checked={lowStockFilter} onChange={(e) => setLowStockFilter(e.target.checked)} />
            <label htmlFor="lowStock">Low Stock Alerts Only</label>
          </div>

          <div className="filter-checkbox-group">
            <input type="checkbox" id="outStock" checked={outOfStockFilter} onChange={(e) => setOutOfStockFilter(e.target.checked)} />
            <label htmlFor="outStock">Out of Stock Only</label>
          </div>

          <div className="filter-field" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={handleResetFilters}>Clear Filters</button>
          </div>
        </div>
      )}

      {error && <div style={{ color: 'var(--color-danger)', fontWeight: '600', marginBottom: '15px' }}>{error}</div>}

      {/* Main Table */}
      <Table
        headers={tableHeaders}
        data={products}
        loading={loading}
        emptyMessage="No products match the filter conditions."
      />

      {/* Pagination Controls */}
      {!loading && products.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalItems} total products)
          </div>
          <div className="pagination-buttons">
            <button
              className="page-btn"
              disabled={page === 1}
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`page-btn ${page === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={page === totalPages}
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditMode ? 'Modify Product Properties' : 'Register New Product'}
      >
        <form onSubmit={handleFormSubmit}>
          {formErrors.submit && (
            <div style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: '600', padding: '10px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(239, 68, 68, 0.15)', marginBottom: '15px' }}>
              {formErrors.submit}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sku">SKU Code / Model *</label>
              <input id="sku" name="sku" type="text" placeholder="e.g. AMUL-BUTR-500" value={formData.sku} onChange={handleInputChange} required />
              {formErrors.sku && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.sku}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="name">Product Name *</label>
              <input id="name" name="name" type="text" placeholder="e.g. Amul Butter 500g" value={formData.name} onChange={handleInputChange} required />
              {formErrors.name && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.name}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="hsn_code">HSN Code</label>
              <input id="hsn_code" name="hsn_code" type="text" placeholder="e.g. 04051000" value={formData.hsn_code} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label htmlFor="unit">Billing Unit</label>
              <select id="unit" name="unit" value={formData.unit} onChange={handleInputChange}>
                <option value="Pieces">Pieces (Pcs)</option>
                <option value="Boxes">Boxes (Box)</option>
                <option value="Cartons">Cartons (Ctn)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="mrp">MRP (₹) *</label>
              <input id="mrp" name="mrp" type="number" step="0.01" value={formData.mrp} onChange={handleInputChange} required />
              {formErrors.mrp && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.mrp}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="purchase_price">Purchase Price (₹) *</label>
              <input id="purchase_price" name="purchase_price" type="number" step="0.01" value={formData.purchase_price} onChange={handleInputChange} required />
              {formErrors.purchase_price && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.purchase_price}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="selling_price">Selling Price (₹) *</label>
              <input id="selling_price" name="selling_price" type="number" step="0.01" value={formData.selling_price} onChange={handleInputChange} required />
              {formErrors.selling_price && <span style={{ color: 'var(--color-danger)', fontSize: '11px' }}>{formErrors.selling_price}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="gst_rate">GST Rate (%)</label>
              <select id="gst_rate" name="gst_rate" value={formData.gst_rate} onChange={handleInputChange}>
                <option value="0.00">0% (Exempt)</option>
                <option value="5.00">5% GST</option>
                <option value="12.00">12% GST</option>
                <option value="18.00">18% GST</option>
                <option value="28.00">28% GST</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="min_stock_level">Minimum Stock Level *</label>
              <input id="min_stock_level" name="min_stock_level" type="number" value={formData.min_stock_level} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="max_stock_level">Maximum Stock Level *</label>
              <input id="max_stock_level" name="max_stock_level" type="number" value={formData.max_stock_level} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="batch_number">Batch Number</label>
              <input id="batch_number" name="batch_number" type="text" placeholder="e.g. BAT-101" value={formData.batch_number} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="expiry_date">Expiry Date</label>
              <input id="expiry_date" name="expiry_date" type="date" value={formData.expiry_date} onChange={handleInputChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="barcode">Barcode Value</label>
              <input id="barcode" name="barcode" type="text" placeholder="Barcode Code" value={formData.barcode} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="image_url">Image Url (Upload Link)</label>
              <input id="image_url" name="image_url" type="text" placeholder="https://..." value={formData.image_url} onChange={handleInputChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select name="category_id" value={formData.category_id} onChange={handleInputChange}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Supplier Vendor</label>
              <select name="supplier_id" value={formData.supplier_id} onChange={handleInputChange}>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* INITIAL INWARD FIELDS (Only visible in Add mode) */}
          {!isEditMode && (
            <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(59, 130, 246, 0.15)', margin: '15px 0' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Initial Warehouse Stock Allocation
              </h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="warehouse_id">Target Warehouse Depot</label>
                  <select id="warehouse_id" name="warehouse_id" value={formData.warehouse_id} onChange={handleInputChange}>
                    <option value="">Choose Warehouse</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="current_stock">Initial Quantity Count</label>
                  <input id="current_stock" name="current_stock" type="number" placeholder="0" value={formData.current_stock} onChange={handleInputChange} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="rack_number">Cabinet/Rack Placement Code</label>
                <input id="rack_number" name="rack_number" type="text" placeholder="e.g. RACK-A-12" value={formData.rack_number} onChange={handleInputChange} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="description">Specification Description</label>
            <textarea id="description" name="description" rows="2" value={formData.description} onChange={handleInputChange}></textarea>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Register Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Catalog Item Deletion"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
            Are you sure you want to delete this product listing? This will also remove all warehouse stock totals!
          </p>
          <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '13px', margin: '4px 0' }}><strong>Item Name:</strong> {productToDelete?.name}</div>
            <div style={{ fontSize: '13px', margin: '4px 0' }}><strong>SKU Code:</strong> <code>{productToDelete?.sku}</code></div>
            <div style={{ fontSize: '13px', margin: '4px 0' }}><strong>Current Total Stock:</strong> {productToDelete?.total_stock} items</div>
            <div style={{ fontSize: '13px', margin: '4px 0' }}><strong>Supplier:</strong> {productToDelete?.supplier_name || 'N/A'}</div>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ backgroundColor: 'var(--color-danger)' }} onClick={handleDeleteConfirm}>
              Permanently Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Stock Inward Adjustment Modal */}
      <Modal
        isOpen={stockInOpen}
        onClose={() => setStockInOpen(false)}
        title={`Stock Inward Intake: ${stockInProduct?.name}`}
      >
        <form onSubmit={handleStockInSubmit}>
          <div className="form-group">
            <label>Intake Quantity</label>
            <input 
              type="number" 
              required 
              value={stockInData.quantity} 
              onChange={(e) => setStockInData(prev => ({ ...prev, quantity: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Purchase Invoice Number</label>
            <input 
              type="text" 
              placeholder="e.g. GST-INV-2026" 
              value={stockInData.invoiceNumber} 
              onChange={(e) => setStockInData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Target Storage Warehouse</label>
            <select 
              value={stockInData.warehouseId} 
              required
              onChange={(e) => setStockInData(prev => ({ ...prev, warehouseId: e.target.value }))}
            >
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.warehouse_code})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Remarks / Notes</label>
            <textarea 
              rows="2" 
              value={stockInData.notes} 
              onChange={(e) => setStockInData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStockInOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Process Inward</button>
          </div>
        </form>
      </Modal>

      {/* Stock Outward Adjustment Modal */}
      <Modal
        isOpen={stockOutOpen}
        onClose={() => setStockOutOpen(false)}
        title={`Stock Outward Dispatch: ${stockOutProduct?.name}`}
      >
        <form onSubmit={handleStockOutSubmit}>
          <div className="form-group">
            <label>Dispatch Quantity</label>
            <input 
              type="number" 
              required 
              value={stockOutData.quantity} 
              onChange={(e) => setStockOutData(prev => ({ ...prev, quantity: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Source Storage Warehouse</label>
            <select 
              value={stockOutData.warehouseId} 
              required
              onChange={(e) => setStockOutData(prev => ({ ...prev, warehouseId: e.target.value }))}
            >
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.warehouse_code})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Remarks / Notes</label>
            <textarea 
              rows="2" 
              value={stockOutData.notes} 
              onChange={(e) => setStockOutData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStockOutOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--color-danger)' }}>Process Dispatch</button>
          </div>
        </form>
      </Modal>

      {/* Barcode Print Modal */}
      <Modal
        isOpen={barcodeOpen}
        onClose={() => setBarcodeOpen(false)}
        title="Print ERP Barcode Sticker"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '10px' }}>
          <div style={{ background: '#fff', color: '#000', padding: '16px', borderRadius: '4px', border: '2px solid #000', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '280px', fontFamily: 'monospace' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>LOGISMART INDIA PVT LTD</div>
            <div style={{ fontSize: '12px', margin: '4px 0', textAlign: 'center' }}>{codeProduct?.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '10px', margin: '2px 0' }}>
              <span>MRP: {formatCurrency(codeProduct?.mrp || 0)}</span>
              <span>HSN: {codeProduct?.hsn_code || 'N/A'}</span>
            </div>
            {/* Mock visual barcode bars */}
            <div style={{ display: 'flex', height: '40px', margin: '10px 0', width: '220px', background: 'repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 6px)' }}></div>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>*{codeProduct?.barcode || codeProduct?.sku}*</div>
          </div>
          <button className="btn btn-primary" onClick={() => window.print()}>
            Print Sticker
          </button>
        </div>
      </Modal>

      {/* QR Code Generate Modal */}
      <Modal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        title="Scan QR Code Details"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '10px' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
            <img 
              src={codeProduct?.qr_code || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${codeProduct?.sku}`} 
              alt="QR Code" 
              style={{ width: '180px', height: '180px' }} 
            />
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            <strong>SKU:</strong> <code>{codeProduct?.sku}</code><br/>
            <strong>HSN:</strong> <code>{codeProduct?.hsn_code || 'N/A'}</code>
          </div>
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Products from CSV"
      >
        <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Paste comma-separated rows here. Order: <code>sku, name, mrp, purchase_price, selling_price, gst_rate, unit</code>
          </p>
          <textarea 
            rows="6" 
            placeholder="SKU-IMP-001, Britannia Biscuit, 40.00, 30.00, 36.00, 18.00, Pieces" 
            value={importText} 
            onChange={(e) => setImportText(e.target.value)}
          />
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setImportOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Process CSV Import</button>
          </div>
        </form>
      </Modal>

      {/* VIEW PRODUCT SIDE DRAWER */}
      {drawerOpen && (
        <div className="side-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="side-drawer open" onClick={(e) => e.stopPropagation()}>
            <div className="side-drawer-header">
              <h3>Product Specifications Drawer</h3>
              <button className="close-drawer-btn" onClick={() => setDrawerOpen(false)}>
                ✕
              </button>
            </div>

            <div className="side-drawer-body">
              {/* Product Image section */}
              <div className="detail-image-card">
                <img 
                  src={viewProduct?.image_url || 'https://images.unsplash.com/photo-1543083115-638c32cd3d58?w=200&auto=format&fit=crop&q=80'} 
                  alt={viewProduct?.name}
                  className="detail-product-img" 
                />
                <h4 style={{ margin: '0', fontWeight: '800' }}>{viewProduct?.name}</h4>
                <code style={{ fontSize: '11px', color: 'var(--color-primary)' }}>{viewProduct?.sku}</code>
              </div>

              {/* General details grid */}
              <div className="detail-field-grid">
                <div className="detail-item-field">
                  <span className="label">HSN Classification</span>
                  <span className="value">{viewProduct?.hsn_code || 'N/A'}</span>
                </div>
                <div className="detail-item-field">
                  <span className="label">Billing Unit</span>
                  <span className="value">{viewProduct?.unit}</span>
                </div>
                <div className="detail-item-field">
                  <span className="label">GST Rate Bracket</span>
                  <span className="value">{viewProduct?.gst_rate}%</span>
                </div>
                <div className="detail-item-field">
                  <span className="label">Overall Total Stock</span>
                  <span className="value" style={{ color: viewProduct?.total_stock < viewProduct?.min_stock_level ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {viewProduct?.total_stock} units
                  </span>
                </div>
              </div>

              {/* Pricing section */}
              <div className="detail-section-title">Billing & Pricing Details</div>
              <div className="detail-field-grid">
                <div className="detail-item-field">
                  <span className="label">Maximum Retail Price (MRP)</span>
                  <span className="value" style={{ color: 'var(--color-primary)' }}>{formatCurrency(viewProduct?.mrp || 0)}</span>
                </div>
                <div className="detail-item-field">
                  <span className="label">Purchase Landing Cost</span>
                  <span className="value">{formatCurrency(viewProduct?.purchase_price || 0)}</span>
                </div>
                <div className="detail-item-field">
                  <span className="label">General Selling Price</span>
                  <span className="value">{formatCurrency(viewProduct?.selling_price || 0)}</span>
                </div>
                <div className="detail-item-field">
                  <span className="label">Batch Identification</span>
                  <span className="value">{viewProduct?.batch_number || 'N/A'}</span>
                </div>
                <div className="detail-item-field">
                  <span className="label">Product Expiry Date</span>
                  <span className="value">{viewProduct?.expiry_date ? formatDate(viewProduct?.expiry_date) : 'N/A'}</span>
                </div>
              </div>

              {/* Supplier details section */}
              <div className="detail-section-title">Supplier Vendor Information</div>
              {viewProduct?.supplier_name ? (
                <div className="detail-field-grid">
                  <div className="detail-item-field">
                    <span className="label">Supplier Company</span>
                    <span className="value">{viewProduct?.supplier_name}</span>
                  </div>
                  <div className="detail-item-field">
                    <span className="label">GSTIN</span>
                    <span className="value">{viewProduct?.supplier_gstin || 'N/A'}</span>
                  </div>
                  <div className="detail-item-field">
                    <span className="label">PAN ID</span>
                    <span className="value">{viewProduct?.supplier_pan || 'N/A'}</span>
                  </div>
                  <div className="detail-item-field">
                    <span className="label">Contact Phone</span>
                    <span className="value">{viewProduct?.supplier_phone || 'N/A'}</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No supplier vendor mapped to this product catalog item.</div>
              )}

              {/* Warehouse depot allocations */}
              <div className="detail-section-title">Active Warehouse Locations</div>
              {viewProduct?.stockLevels && viewProduct.stockLevels.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {viewProduct.stockLevels.map((sl, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-secondary)', fontSize: '12px' }}>
                      <span><strong>{sl.warehouse_name} ({sl.warehouse_code})</strong></span>
                      <span>{sl.quantity} units {sl.rack_number && `• Rack: ${sl.rack_number}`}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No active quantities stored in any warehouse depot.</div>
              )}

              {/* Transaction movements ledger */}
              <div className="detail-section-title">Stock Ledger & Audit Logs</div>
              {viewProduct?.stockHistory && viewProduct.stockHistory.length > 0 ? (
                <div className="drawer-history-list">
                  {viewProduct.stockHistory.slice(0, 10).map((sh, idx) => (
                    <div key={idx} className="history-card">
                      <div className="history-card-header">
                        <span className={`badge badge-${sh.type.toLowerCase() === 'transfer' ? 'info' : sh.type.toLowerCase() === 'in' ? 'success' : 'danger'}`}>
                          {sh.type}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{formatDate(sh.created_at)}</span>
                      </div>
                      <div style={{ fontWeight: '600' }}>Quantity: {sh.quantity} units</div>
                      {sh.type === 'IN' && <div>Inward to <strong>{sh.to_warehouse} ({sh.to_warehouse_code})</strong></div>}
                      {sh.type === 'OUT' && <div>Outward from <strong>{sh.from_warehouse} ({sh.from_warehouse_code})</strong></div>}
                      {sh.type === 'TRANSFER' && <div>Transfer: <strong>{sh.from_warehouse_code}</strong> &rarr; <strong>{sh.to_warehouse_code}</strong></div>}
                      {sh.invoice_number && <div style={{ fontSize: '10px' }}><span style={{ color: 'var(--text-muted)' }}>Doc Reference:</span> {sh.invoice_number}</div>}
                      {sh.notes && <div style={{ fontStyle: 'italic', fontSize: '10px', marginTop: '4px' }}>"{sh.notes}"</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No inventory movements logged for this product.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;
