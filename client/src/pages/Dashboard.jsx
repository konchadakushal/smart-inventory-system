import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import StockChart from '../components/StockChart';
import { formatCurrency, formatTime, formatDate } from '../utils/format';
import './Dashboard.css';

/**
 * Enterprise Indian Localized Dashboard View.
 * Displays real-time warehouse utilization, reorder alerts, transactions history, and financial metrics.
 * Tailors cards and widgets dynamically based on user role authorization (RBAC).
 */
const Dashboard = () => {
  const { user } = useAuth();
  const isStaff = user?.role === 'Staff';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard');
      setData(response.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve warehouse analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: '15px' }}>
        <p style={{ color: 'var(--color-danger)', fontWeight: '600' }}>{error}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary" style={{ padding: '8px 16px' }}>
          Retry Load
        </button>
      </div>
    );
  }

  // Extract variables safely
  const metrics = data?.metrics || { 
    totalProducts: 0, 
    totalSuppliers: 0, 
    totalStock: 0, 
    lowStockCount: 0,
    totalInventoryValue: 0,
    todaysSales: 0,
    todaysStockIn: 0,
    todaysStockOut: 0
  };
  const alerts = data?.alerts || [];
  const activities = data?.activities || [];
  const categoryDistribution = data?.categoryDistribution || [];
  const monthlyMovements = data?.monthlyMovements || [];
  const warehouseUtilization = data?.warehouseUtilization || [];
  const supplierPerformance = data?.supplierPerformance || [];

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Role-Based Greeting Banner */}
      <div className="dashboard-greeting-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '20px', background: 'rgba(30, 41, 59, 0.45)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 'var(--border-radius-md)' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
            Namaste, {user?.username}!
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
            {isStaff 
              ? 'Welcome to your operational dashboard. You are restricted to your assigned warehouse statistics.' 
              : 'Enterprise-wide warehouse tracking and inventory audit dashboard.'}
          </p>
        </div>
        <span className={`badge ${user?.role === 'Admin' ? 'badge-danger' : user?.role === 'Manager' ? 'badge-warning' : 'badge-info'}`} style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '700', borderRadius: '20px' }}>
          {user?.role} Portal
        </span>
      </div>

      {/* 1. Stat cards section */}
      <section className="dashboard-metrics-grid" style={{ display: 'grid', gridTemplateColumns: isStaff ? 'repeat(auto-fill, minmax(220px, 1fr))' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
        {!isStaff && (
          <>
            <StatCard
              title="Today's Outward Sales"
              value={formatCurrency(metrics.todaysSales)}
              loading={loading}
              type="primary"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
            />
            <StatCard
              title="Total Inventory Value"
              value={formatCurrency(metrics.totalInventoryValue)}
              loading={loading}
              type="info"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                  <line x1="6" y1="6" x2="6.01" y2="6" />
                  <line x1="6" y1="18" x2="6.01" y2="18" />
                </svg>
              }
            />
          </>
        )}
        <StatCard
          title="Active Stock Units"
          value={`${metrics.totalStock.toLocaleString('en-IN')} units`}
          loading={loading}
          type="success"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />
        <StatCard
          title="Stock Reorder Alerts"
          value={`${metrics.lowStockCount} items`}
          loading={loading}
          type={metrics.lowStockCount > 0 ? 'danger' : 'success'}
          description={metrics.lowStockCount > 0 ? 'Requires immediate action' : 'All items optimal'}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
        />
        {!isStaff && (
          <>
            <StatCard
              title="Total Products Listed"
              value={`${metrics.totalProducts} lines`}
              loading={loading}
              type="primary"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              }
            />
            <StatCard
              title="Registered Suppliers"
              value={`${metrics.totalSuppliers} vendors`}
              loading={loading}
              type="info"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              }
            />
          </>
        )}
        <StatCard
          title="Today Inward Receipt"
          value={`${metrics.todaysStockIn.toLocaleString('en-IN')} units`}
          loading={loading}
          type="success"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="17 11 12 16 7 11" />
              <line x1="12" y1="4" x2="12" y2="16" />
              <path d="M19 21H5" />
            </svg>
          }
        />
        <StatCard
          title="Today Outward Dispatch"
          value={`${metrics.todaysStockOut.toLocaleString('en-IN')} units`}
          loading={loading}
          type="warning"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
              <path d="M19 21H5" />
            </svg>
          }
        />
      </section>

      {/* 2. Charts & Warehouse Capacity */}
      <section className="dashboard-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '24px' }}>
        <div className="chart-card-panel">
          <div className="panel-header">
            <h3 className="panel-title">Stock Movements (6-Month Trend)</h3>
          </div>
          <StockChart type="movements" data={monthlyMovements} />
        </div>

        <div className="chart-card-panel">
          <div className="panel-header">
            <h3 className="panel-title">Storage Depots Capacity</h3>
          </div>
          <div className="warehouse-capacity-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '300px', overflowY: 'auto' }}>
            {warehouseUtilization.map((wh) => {
              const current = wh.current_stock;
              const cap = wh.capacity;
              const pct = cap > 0 ? Math.min(Math.round((current / cap) * 100), 100) : 0;
              let fillClass = 'fill-success';
              if (pct > 85) fillClass = 'fill-danger';
              else if (pct > 70) fillClass = 'fill-warning';

              return (
                <div key={wh.id} className="wh-util-row">
                  <div className="wh-util-info">
                    <span className="wh-name-title">{wh.name} ({wh.warehouse_code || 'WH'})</span>
                    <span className="wh-qty-desc">{current.toLocaleString('en-IN')} / {cap.toLocaleString('en-IN')} Units</span>
                  </div>
                  <div className="progress-container">
                    <div className={`progress-bar ${fillClass}`} style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="wh-pct-legend">
                    <span>Utilization Rate</span>
                    <span className={`legend-pct-text ${pct > 85 ? 'text-danger' : pct > 70 ? 'text-warning' : 'text-success'}`}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Category Splits & Vendors performance (Admin only) */}
      <section className="dashboard-charts-grid" style={{ display: 'grid', gridTemplateColumns: isStaff ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '24px' }}>
        <div className="chart-card-panel">
          <div className="panel-header">
            <h3 className="panel-title">Stock Distribution by Category</h3>
          </div>
          <StockChart type="donut" data={categoryDistribution} />
        </div>

        {!isStaff && (
          <div className="chart-card-panel">
            <div className="panel-header">
              <h3 className="panel-title">Top Vendors Performance</h3>
            </div>
            <div className="supplier-performance-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {supplierPerformance.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                  No vendor holding data available.
                </p>
              ) : (
                supplierPerformance.map((sup, index) => (
                  <div key={sup.id} className="sup-perf-row">
                    <div className="sup-perf-rank flex-center">
                      <span>{index + 1}</span>
                    </div>
                    <div className="sup-perf-detail">
                      <span className="sup-name-txt">{sup.name}</span>
                      <span className="sup-desc-txt">{sup.products_count} active product lines supplied</span>
                    </div>
                    <div className="sup-perf-val">
                      <span className="perf-stock-qty">{sup.total_stock.toLocaleString('en-IN')} units</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      {/* 4. Operations Ledger & Warnings warnings */}
      <section className="dashboard-bottom-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '24px' }}>
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title">Recent Stock Operations Ledger</h3>
          </div>
          
          <div className="activities-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '380px', overflowY: 'auto' }}>
            {activities.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                No recent transactions found.
              </p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="activity-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                  <div className="activity-left" style={{ display: 'flex', gap: '12px' }}>
                    <div className={`activity-badge badge-${act.type.toLowerCase()}`} style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', height: 'fit-content' }}>
                      {act.type}
                    </div>
                    <div className="activity-details" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                      <span className="activity-product" style={{ fontWeight: '600', fontSize: '13.5px', color: '#ffffff' }}>{act.product_name}</span>
                      <span className="activity-notes" style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {act.notes || 'No description'} 
                        {act.operator_name && ` • by ${act.operator_name}`}
                      </span>
                      <div className="activity-ref-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        {act.from_warehouse && (
                          <span className="ref-badge-loc" style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>From: {act.from_warehouse}</span>
                        )}
                        {act.to_warehouse && (
                          <span className="ref-badge-loc" style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>To: {act.to_warehouse}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="activity-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <span className={`activity-qty text-${act.type.toLowerCase()}`} style={{ fontWeight: '700', fontSize: '14px' }}>
                      {act.type === 'OUT' ? '-' : '+'}{act.quantity}
                    </span>
                    <span className="activity-time" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {formatTime(act.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title" style={{ color: alerts.length > 0 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
              Stock Reorder Warnings (Auto-Indent)
            </h3>
          </div>
          
          <div className="alerts-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto' }}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--color-success)' }}>
                <svg style={{ width: '40px', height: '40px', marginBottom: '10px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p style={{ fontSize: '14px', fontWeight: '600' }}>All warehouse stock levels are optimal.</p>
              </div>
            ) : (
              alerts.map((item) => (
                <div key={item.id} className="alert-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(239, 68, 68, 0.02)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: 'var(--border-radius-sm)' }}>
                  <div style={{ textAlign: 'left' }}>
                    <span className="alert-item-name" style={{ fontWeight: '600', fontSize: '13.5px', color: '#ffffff' }}>{item.name}</span>
                    <div className="alert-item-sku" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>SKU: {item.sku} • Category: {item.category_name || 'General'}</div>
                  </div>
                  <div className="alert-stock-status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span className="alert-current-qty text-danger" style={{ fontWeight: '700', fontSize: '13.5px' }}>{item.current_stock} units left</span>
                    <span className="alert-min-qty" style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Threshold: {item.min_stock_level}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
