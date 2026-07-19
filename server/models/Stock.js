import pool from '../config/db.js';

class Stock {
  /**
   * Fetch details of all stock currently stored inside a specific warehouse
   */
  static async findByWarehouse(warehouseId) {
    const query = `
      SELECT sl.quantity, sl.rack_number, p.id AS product_id, p.sku, p.name AS product_name, p.mrp, p.purchase_price, p.selling_price, p.unit,
             c.name AS category_name
      FROM stock_levels sl
      JOIN products p ON sl.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE sl.warehouse_id = ?
      ORDER BY p.name ASC
    `;
    const [rows] = await pool.execute(query, [warehouseId]);
    return rows;
  }

  /**
   * Fetch warehouse locations and levels where a specific product is stored
   */
  static async findByProduct(productId) {
    const query = `
      SELECT sl.quantity, sl.rack_number, w.id AS warehouse_id, w.name AS warehouse_name, w.location, w.warehouse_code
      FROM stock_levels sl
      JOIN warehouses w ON sl.warehouse_id = w.id
      WHERE sl.product_id = ?
      ORDER BY w.name ASC
    `;
    const [rows] = await pool.execute(query, [productId]);
    return rows;
  }

  /**
   * Fetch current quantity of a specific product inside a specific warehouse (with optional connection for transactions)
   */
  static async getQuantity(connection, warehouseId, productId, lock = false) {
    let query = 'SELECT quantity FROM stock_levels WHERE warehouse_id = ? AND product_id = ?';
    if (lock) {
      query += ' FOR UPDATE'; // Row-level lock to prevent race conditions during transaction
    }
    const [rows] = await connection.execute(query, [warehouseId, productId]);
    return rows.length > 0 ? rows[0].quantity : 0;
  }

  /**
   * Upsert stock quantity for a warehouse (transaction connection required)
   */
  static async adjustQuantity(connection, warehouseId, productId, delta, rackNumber = null) {
    // Check if record exists
    const currentQty = await this.getQuantity(connection, warehouseId, productId, true);
    const exists = currentQty !== 0 || (await this.recordExists(connection, warehouseId, productId));

    if (exists) {
      const query = 'UPDATE stock_levels SET quantity = quantity + ?, rack_number = COALESCE(?, rack_number) WHERE warehouse_id = ? AND product_id = ?';
      const [result] = await connection.execute(query, [delta, rackNumber, warehouseId, productId]);
      return result.affectedRows > 0;
    } else {
      const query = 'INSERT INTO stock_levels (warehouse_id, product_id, quantity, rack_number) VALUES (?, ?, ?, ?)';
      const [result] = await connection.execute(query, [warehouseId, productId, delta, rackNumber]);
      return result.insertId !== undefined;
    }
  }

  /**
   * Internal helper to verify row presence
   */
  static async recordExists(connection, warehouseId, productId) {
    const query = 'SELECT 1 FROM stock_levels WHERE warehouse_id = ? AND product_id = ?';
    const [rows] = await connection.execute(query, [warehouseId, productId]);
    return rows.length > 0;
  }

  /**
   * Insert a movement record into the stock transactions history ledger (transaction connection required)
   */
  static async createTransaction(connection, { productId, fromWarehouseId, toWarehouseId, quantity, type, userId, notes, invoiceNumber = null, poNumber = null }) {
    const query = `
      INSERT INTO stock_transactions (product_id, from_warehouse_id, to_warehouse_id, quantity, type, user_id, notes, invoice_number, po_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await connection.execute(query, [
      productId,
      fromWarehouseId || null,
      toWarehouseId || null,
      quantity,
      type,
      userId,
      notes || '',
      invoiceNumber || null,
      poNumber || null
    ]);
    return result.insertId;
  }

  /**
   * Fetch all historical transactions logs (Audit Reports view)
   */
  static async getTransactionHistory() {
    const query = `
      SELECT t.id, t.quantity, t.type, t.notes, t.invoice_number, t.po_number, t.created_at,
             p.name AS product_name, p.sku AS product_sku, p.unit,
             u.username AS operator_name,
             wf.name AS from_warehouse, wf.warehouse_code AS from_warehouse_code,
             wt.name AS to_warehouse, wt.warehouse_code AS to_warehouse_code
      FROM stock_transactions t
      JOIN products p ON t.product_id = p.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN warehouses wf ON t.from_warehouse_id = wf.id
      LEFT JOIN warehouses wt ON t.to_warehouse_id = wt.id
      ORDER BY t.created_at DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  }
}

export default Stock;
