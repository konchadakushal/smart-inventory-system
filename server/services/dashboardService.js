import pool from '../config/db.js';

class DashboardService {
  /**
   * Fetch all stats, movements, category splits, alerts, and activity logs
   * Restricts data to a specific warehouse if the user is a Staff member
   */
  static async getDashboardData(user) {
    const isStaff = user && user.role === 'Staff';
    const whId = user && user.warehouse_id;

    // 1. Fetch summary totals
    const totalProductsQuery = 'SELECT COUNT(*) AS total FROM products';
    const totalSuppliersQuery = 'SELECT COUNT(*) AS total FROM suppliers';
    
    const totalStockQuery = isStaff && whId 
      ? 'SELECT SUM(quantity) AS total FROM stock_levels WHERE warehouse_id = ?' 
      : 'SELECT SUM(quantity) AS total FROM stock_levels';
    
    // Total Inventory Value (Quantity * Purchase Price)
    const totalInventoryValueQuery = isStaff && whId
      ? `SELECT COALESCE(SUM(sl.quantity * p.purchase_price), 0) AS total 
         FROM stock_levels sl 
         JOIN products p ON sl.product_id = p.id
         WHERE sl.warehouse_id = ?`
      : `SELECT COALESCE(SUM(sl.quantity * p.purchase_price), 0) AS total 
         FROM stock_levels sl 
         JOIN products p ON sl.product_id = p.id`;

    // Today's Sales (Stock OUT * Selling Price today)
    const todaysSalesQuery = isStaff && whId
      ? `SELECT COALESCE(SUM(st.quantity * p.selling_price), 0) AS total 
         FROM stock_transactions st 
         JOIN products p ON st.product_id = p.id 
         WHERE st.type = 'OUT' AND DATE(st.created_at) = CURDATE() AND st.from_warehouse_id = ?`
      : `SELECT COALESCE(SUM(st.quantity * p.selling_price), 0) AS total 
         FROM stock_transactions st 
         JOIN products p ON st.product_id = p.id 
         WHERE st.type = 'OUT' AND DATE(st.created_at) = CURDATE()`;

    // Today's Stock In
    const todaysStockInQuery = isStaff && whId
      ? `SELECT COALESCE(SUM(quantity), 0) AS total 
         FROM stock_transactions 
         WHERE type = 'IN' AND DATE(created_at) = CURDATE() AND to_warehouse_id = ?`
      : `SELECT COALESCE(SUM(quantity), 0) AS total 
         FROM stock_transactions 
         WHERE type = 'IN' AND DATE(created_at) = CURDATE()`;

    // Today's Stock Out
    const todaysStockOutQuery = isStaff && whId
      ? `SELECT COALESCE(SUM(quantity), 0) AS total 
         FROM stock_transactions 
         WHERE type = 'OUT' AND DATE(created_at) = CURDATE() AND from_warehouse_id = ?`
      : `SELECT COALESCE(SUM(quantity), 0) AS total 
         FROM stock_transactions 
         WHERE type = 'OUT' AND DATE(created_at) = CURDATE()`;
    
    // Low stock: sum of quantities per product compared with p.min_stock_level
    const lowStockQuery = isStaff && whId
      ? `SELECT COUNT(*) AS total FROM (
          SELECT p.id, p.min_stock_level, COALESCE(SUM(CASE WHEN s.warehouse_id = ? THEN s.quantity ELSE 0 END), 0) AS current_stock
          FROM products p
          LEFT JOIN stock_levels s ON p.id = s.product_id
          GROUP BY p.id
          HAVING current_stock < p.min_stock_level
        ) AS low_stock_items`
      : `SELECT COUNT(*) AS total FROM (
          SELECT p.id, p.min_stock_level, COALESCE(SUM(s.quantity), 0) AS current_stock
          FROM products p
          LEFT JOIN stock_levels s ON p.id = s.product_id
          GROUP BY p.id
          HAVING current_stock < p.min_stock_level
        ) AS low_stock_items`;

    // 2. Fetch inventory alerts (details of low stock items)
    const alertsQuery = isStaff && whId
      ? `SELECT p.id, p.sku, p.name, p.min_stock_level, 
               COALESCE(SUM(CASE WHEN s.warehouse_id = ? THEN s.quantity ELSE 0 END), 0) AS current_stock,
               c.name AS category_name
        FROM products p
        LEFT JOIN stock_levels s ON p.id = s.product_id
        LEFT JOIN categories c ON p.category_id = c.id
        GROUP BY p.id
        HAVING current_stock < p.min_stock_level
        ORDER BY current_stock ASC
        LIMIT 10`
      : `SELECT p.id, p.sku, p.name, p.min_stock_level, 
               COALESCE(SUM(s.quantity), 0) AS current_stock,
               c.name AS category_name
        FROM products p
        LEFT JOIN stock_levels s ON p.id = s.product_id
        LEFT JOIN categories c ON p.category_id = c.id
        GROUP BY p.id
        HAVING current_stock < p.min_stock_level
        ORDER BY current_stock ASC
        LIMIT 10`;

    // 3. Fetch recent movements (last 7 actions)
    const activitiesQuery = isStaff && whId
      ? `SELECT t.id, t.quantity, t.type, t.notes, t.created_at,
                p.name AS product_name, p.sku AS product_sku,
                u.username AS operator_name,
                wf.name AS from_warehouse,
                wt.name AS to_warehouse
         FROM stock_transactions t
         JOIN products p ON t.product_id = p.id
         LEFT JOIN users u ON t.user_id = u.id
         LEFT JOIN warehouses wf ON t.from_warehouse_id = wf.id
         LEFT JOIN warehouses wt ON t.to_warehouse_id = wt.id
         WHERE t.from_warehouse_id = ? OR t.to_warehouse_id = ?
         ORDER BY t.created_at DESC
         LIMIT 7`
      : `SELECT t.id, t.quantity, t.type, t.notes, t.created_at,
                p.name AS product_name, p.sku AS product_sku,
                u.username AS operator_name,
                wf.name AS from_warehouse,
                wt.name AS to_warehouse
         FROM stock_transactions t
         JOIN products p ON t.product_id = p.id
         LEFT JOIN users u ON t.user_id = u.id
         LEFT JOIN warehouses wf ON t.from_warehouse_id = wf.id
         LEFT JOIN warehouses wt ON t.to_warehouse_id = wt.id
         ORDER BY t.created_at DESC
         LIMIT 7`;

    // 4. Fetch category splits
    const categoriesQuery = `
      SELECT c.name AS name, COUNT(p.id) AS value
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY value DESC
    `;

    // 5. Fetch monthly stock IN and OUT quantities for the past 6 months
    const monthlyQuery = isStaff && whId
      ? `SELECT DATE_FORMAT(created_at, '%b %y') AS month,
                SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END) AS stock_in,
                SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS stock_out
         FROM stock_transactions
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
           AND (from_warehouse_id = ? OR to_warehouse_id = ?)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %y')
         ORDER BY MIN(created_at) ASC`
      : `SELECT DATE_FORMAT(created_at, '%b %y') AS month,
                SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END) AS stock_in,
                SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) AS stock_out
         FROM stock_transactions
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %y')
         ORDER BY MIN(created_at) ASC`;

    // 6. Fetch Warehouse Utilization
    const warehouseUtilizationQuery = isStaff && whId
      ? `SELECT w.id, w.name, w.capacity, w.warehouse_code,
                COALESCE(SUM(sl.quantity), 0) AS current_stock
         FROM warehouses w
         LEFT JOIN stock_levels sl ON w.id = sl.warehouse_id
         WHERE w.id = ?
         GROUP BY w.id`
      : `SELECT w.id, w.name, w.capacity, w.warehouse_code,
                COALESCE(SUM(sl.quantity), 0) AS current_stock
         FROM warehouses w
         LEFT JOIN stock_levels sl ON w.id = sl.warehouse_id
         GROUP BY w.id
         ORDER BY current_stock DESC`;

    // 7. Fetch Supplier Performance
    const supplierPerformanceQuery = `
      SELECT s.id, s.name, COUNT(DISTINCT p.id) AS products_count,
             COALESCE(SUM(sl.quantity), 0) AS total_stock
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id
      LEFT JOIN stock_levels sl ON p.id = sl.product_id
      GROUP BY s.id
      ORDER BY total_stock DESC
      LIMIT 5
    `;

    const execQuery = (q, params = []) => pool.execute(q, params);

    const [
      [pCount], 
      [sCount], 
      [stockCount], 
      [lowCount], 
      [totalInvValue], 
      [todaysSales], 
      [todaysStockIn], 
      [todaysStockOut]
    ] = await Promise.all([
      execQuery(totalProductsQuery),
      execQuery(totalSuppliersQuery),
      execQuery(totalStockQuery, isStaff && whId ? [whId] : []),
      execQuery(lowStockQuery, isStaff && whId ? [whId] : []),
      execQuery(totalInventoryValueQuery, isStaff && whId ? [whId] : []),
      execQuery(todaysSalesQuery, isStaff && whId ? [whId] : []),
      execQuery(todaysStockInQuery, isStaff && whId ? [whId] : []),
      execQuery(todaysStockOutQuery, isStaff && whId ? [whId] : [])
    ]);

    const [alerts] = await pool.execute(alertsQuery, isStaff && whId ? [whId] : []);
    const [activities] = await pool.execute(activitiesQuery, isStaff && whId ? [whId, whId] : []);
    const [categories] = await pool.execute(categoriesQuery);
    const [monthly] = await pool.execute(monthlyQuery, isStaff && whId ? [whId, whId] : []);
    const [warehouseUtilization] = await pool.execute(warehouseUtilizationQuery, isStaff && whId ? [whId] : []);
    const [supplierPerformance] = await pool.execute(supplierPerformanceQuery);

    return {
      metrics: {
        totalProducts: pCount[0].total || 0,
        totalSuppliers: sCount[0].total || 0,
        totalStock: parseInt(stockCount[0].total, 10) || 0,
        lowStockCount: lowCount[0].total || 0,
        totalInventoryValue: parseFloat(totalInvValue[0].total) || 0,
        todaysSales: parseFloat(todaysSales[0].total) || 0,
        todaysStockIn: parseInt(todaysStockIn[0].total, 10) || 0,
        todaysStockOut: parseInt(todaysStockOut[0].total, 10) || 0
      },
      alerts,
      activities,
      categoryDistribution: categories,
      monthlyMovements: monthly,
      warehouseUtilization,
      supplierPerformance
    };
  }
}

export default DashboardService;
