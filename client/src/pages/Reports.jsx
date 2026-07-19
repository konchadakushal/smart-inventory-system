import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Table from '../components/Table';
import { formatDate, formatTime } from '../utils/format';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './Reports.css';

/**
 * Audit Reports View (Indian ERP Edition).
 * Displays historical transactions ledger logs with quick filters and date range selectors.
 * Supports CSV, Excel, and PDF exporting restricted to Admins and Managers.
 */
const Reports = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'Staff';

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // IN, OUT, TRANSFER, TODAY, MONTH, ALL
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stock/history');
      setHistory(response.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve inventory audit history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filter history client-side
  const filteredHistory = history.filter((log) => {
    // 1. Text Search matches SKU, product name, notes, operator, Invoice or PO code
    const matchesSearch = 
      log.product_name.toLowerCase().includes(search.toLowerCase()) ||
      log.product_sku.toLowerCase().includes(search.toLowerCase()) ||
      (log.operator_name && log.operator_name.toLowerCase().includes(search.toLowerCase())) ||
      (log.notes && log.notes.toLowerCase().includes(search.toLowerCase())) ||
      (log.invoice_number && log.invoice_number.toLowerCase().includes(search.toLowerCase())) ||
      (log.po_number && log.po_number.toLowerCase().includes(search.toLowerCase()));

    // 2. 6-Way Presets and type filters
    let matchesType = true;
    const logDate = new Date(log.created_at);
    const today = new Date();

    if (typeFilter === 'IN' || typeFilter === 'OUT' || typeFilter === 'TRANSFER') {
      matchesType = log.type === typeFilter;
    } else if (typeFilter === 'TODAY') {
      matchesType = logDate.toDateString() === today.toDateString();
    } else if (typeFilter === 'MONTH') {
      matchesType = 
        logDate.getMonth() === today.getMonth() && 
        logDate.getFullYear() === today.getFullYear();
    }

    // 3. Start & End Date filters
    let matchesDateRange = true;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesDateRange = matchesDateRange && logDate >= start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDateRange = matchesDateRange && logDate <= end;
    }

    return matchesSearch && matchesType && matchesDateRange;
  });

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return;

    // Define columns
    const headers = [
      'Transaction ID', 
      'Date (DD-MM-YYYY)', 
      'Time', 
      'Product SKU', 
      'Product Name', 
      'Unit',
      'Type', 
      'From Location', 
      'To Location', 
      'Quantity', 
      'Invoice Reference', 
      'Purchase Order (PO)', 
      'Authorized By', 
      'Notes'
    ];
    
    // Format rows
    const rows = filteredHistory.map((log) => {
      const dateStr = formatDate(log.created_at);
      const timeStr = formatTime(log.created_at);

      return [
        log.id,
        dateStr,
        timeStr,
        `"${log.product_sku}"`,
        `"${log.product_name.replace(/"/g, '""')}"`,
        log.unit || 'pcs',
        log.type,
        `"${(log.from_warehouse || 'N/A').replace(/"/g, '""')}"`,
        `"${(log.to_warehouse || 'N/A').replace(/"/g, '""')}"`,
        log.quantity,
        `"${log.invoice_number || 'N/A'}"`,
        `"${log.po_number || 'N/A'}"`,
        `"${(log.operator_name || 'N/A').replace(/"/g, '""')}"`,
        `"${(log.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `logismart_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (filteredHistory.length === 0) return;

    // Format data for sheet
    const dataToExport = filteredHistory.map((log) => ({
      'Transaction ID': log.id,
      'Date': formatDate(log.created_at),
      'Time': formatTime(log.created_at),
      'Product SKU': log.product_sku,
      'Product Name': log.product_name,
      'Unit': log.unit || 'pcs',
      'Type': log.type,
      'From Location': log.from_warehouse || 'N/A',
      'To Location': log.to_warehouse || 'N/A',
      'Quantity': log.quantity,
      'Invoice Reference': log.invoice_number || 'N/A',
      'Purchase Order (PO)': log.po_number || 'N/A',
      'Authorized By': log.operator_name || 'N/A',
      'Notes': log.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Ledger');

    // Auto-fit column widths
    worksheet['!cols'] = Object.keys(dataToExport[0]).map(() => ({ wch: 15 }));

    XLSX.writeFile(workbook, `logismart_audit_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPDF = () => {
    if (filteredHistory.length === 0) return;

    const doc = new jsPDF('landscape');
    
    // Title & Header details
    doc.setFontSize(18);
    doc.setTextColor(11, 15, 25);
    doc.text('LOGISMART - Smart Inventory Management', 14, 15);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Inventory Audit Trail Report - Generated on: ${new Date().toLocaleDateString()}`, 14, 21);

    // Columns config
    const tableColumn = [
      'ID', 
      'Date/Time', 
      'SKU', 
      'Product Name', 
      'Type', 
      'From Location', 
      'To Location', 
      'Qty', 
      'Ref Docs', 
      'User'
    ];

    // Format rows
    const tableRows = filteredHistory.map((log) => {
      const dateTime = `${formatDate(log.created_at)} ${formatTime(log.created_at)}`;
      const refDocs = [
        log.invoice_number ? `Inv: ${log.invoice_number}` : '',
        log.po_number ? `PO: ${log.po_number}` : ''
      ].filter(Boolean).join('\n') || 'N/A';

      return [
        log.id,
        dateTime,
        log.product_sku,
        log.product_name,
        log.type,
        log.from_warehouse || 'N/A',
        log.to_warehouse || 'N/A',
        `${log.quantity} ${log.unit || 'pcs'}`,
        refDocs,
        log.operator_name || 'N/A'
      ];
    });

    // Generate table with jspdf-autotable
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 26,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], halign: 'center' },
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 50 },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 35 },
        6: { cellWidth: 35 },
        7: { cellWidth: 20, halign: 'center' },
        8: { cellWidth: 30 },
        9: { cellWidth: 25 }
      }
    });

    doc.save(`logismart_audit_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Reusable Table Headers config for ledger logs
  const reportHeaders = [
    { 
      key: 'created_at', 
      label: 'Date & Time', 
      width: '18%',
      render: (row) => (
        <div>
          <span style={{ fontWeight: '600' }}>{formatDate(row.created_at)}</span>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{formatTime(row.created_at)}</div>
        </div>
      )
    },
    { 
      key: 'sku', 
      label: 'SKU / Batch', 
      width: '18%', 
      render: (row) => (
        <div>
          <span style={{ fontWeight: '600' }}>{row.product_sku}</span>
          {row.batch_number && <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Batch: {row.batch_number}</div>}
        </div>
      )
    },
    { key: 'product_name', label: 'Product Name', width: '22%' },
    { 
      key: 'type', 
      label: 'Tx Type', 
      width: '12%',
      render: (row) => (
        <span className={`badge badge-${row.type.toLowerCase()}`} style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px' }}>
          {row.type}
        </span>
      )
    },
    { key: 'from_warehouse', label: 'Source', width: '15%', render: (row) => row.from_warehouse || 'N/A' },
    { key: 'to_warehouse', label: 'Destination', width: '15%', render: (row) => row.to_warehouse || 'N/A' },
    { key: 'quantity', label: 'Qty', width: '10%', render: (row) => <strong>{row.quantity} {row.unit || 'pcs'}</strong> },
    { 
      key: 'operator_name', 
      label: 'Authorized By', 
      width: '15%',
      render: (row) => (
        <div>
          <span style={{ fontWeight: '500' }}>{row.operator_name || 'N/A'}</span>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{row.role || 'Staff'}</div>
        </div>
      )
    }
  ];

  return (
    <div className="reports-page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">FMCG Audit Trail Reports</h1>
          <p className="page-subtitle">Historical movements ledger logs with multi-filters and export options.</p>
        </div>
      </div>

      <div className="filter-card" style={{ marginBottom: '20px', padding: '18px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', flex: '1' }}>
            <div style={{ minWidth: '200px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Text Search</label>
              <input
                type="text"
                placeholder="Search by SKU, product, user, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Tx Type / Presets</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ padding: '9px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '13px', minWidth: '150px' }}
              >
                <option value="">All Transactions</option>
                <option value="IN">Inward Receipts (IN)</option>
                <option value="OUT">Outward Dispatches (OUT)</option>
                <option value="TRANSFER">Inter-Warehouse (TRANSFER)</option>
                <option value="TODAY">Created Today</option>
                <option value="MONTH">Created This Month</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="date-input-wrapper">
                <label style={{ fontSize: '11px', display: 'block', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '6px' }}>Start Date</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  style={{ padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
              </div>
              <div className="date-input-wrapper">
                <label style={{ fontSize: '11px', display: 'block', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '6px' }}>End Date</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  style={{ padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
              </div>
              {(startDate || endDate) && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  style={{ padding: '6px 12px', fontSize: '11px', alignSelf: 'flex-end', height: '36px' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {!isStaff && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleExportCSV}
                disabled={filteredHistory.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', height: '38px', fontSize: '12.5px' }}
              >
                CSV
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleExportExcel}
                disabled={filteredHistory.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', height: '38px', fontSize: '12.5px' }}
              >
                Excel
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleExportPDF}
                disabled={filteredHistory.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', height: '38px', fontSize: '12.5px' }}
              >
                PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <div style={{ color: 'var(--color-danger)', fontWeight: '600', marginBottom: '15px' }}>{error}</div>}

      {/* Main Audit Logs Table */}
      <Table
        headers={reportHeaders}
        data={filteredHistory}
        loading={loading}
        emptyMessage="No transaction ledger matches these filtering rules."
      />
    </div>
  );
};

export default Reports;
