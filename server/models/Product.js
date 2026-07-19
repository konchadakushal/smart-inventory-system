import pool from '../config/db.js';

class Product {
  /**
   * Find a product by its ID
   */
  static async findById(id) {
    const query = `
      SELECT p.*, c.name AS category_name, s.name AS supplier_name,
             s.email AS supplier_email, s.phone AS supplier_phone, s.gstin AS supplier_gstin, s.pan AS supplier_pan, s.address AS supplier_address,
             COALESCE((SELECT SUM(quantity) FROM stock_levels WHERE product_id = p.id), 0) AS total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find a product by its SKU
   */
  static async findBySku(sku) {
    const query = 'SELECT id, sku, name FROM products WHERE sku = ?';
    const [rows] = await pool.execute(query, [sku]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find products with filtering, search, and pagination
   */
  static async findAndCount({ 
    search = '', 
    categoryId = null, 
    supplierId = null,
    warehouseId = null,
    lowStock = false,
    outOfStock = false,
    gstRate = null,
    limit = 10, 
    offset = 0 
  }) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ? OR p.barcode LIKE ? OR p.hsn_code LIKE ?)';
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild, searchWild, searchWild);
    }

    if (categoryId) {
      whereClause += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    if (supplierId) {
      whereClause += ' AND p.supplier_id = ?';
      params.push(supplierId);
    }

    if (gstRate !== null && gstRate !== '') {
      whereClause += ' AND p.gst_rate = ?';
      params.push(parseFloat(gstRate));
    }

    if (warehouseId) {
      whereClause += ' AND EXISTS (SELECT 1 FROM stock_levels sl WHERE sl.product_id = p.id AND sl.warehouse_id = ?)';
      params.push(warehouseId);
    }

    if (lowStock === true || lowStock === 'true') {
      whereClause += ' AND COALESCE((SELECT SUM(quantity) FROM stock_levels sl WHERE sl.product_id = p.id), 0) < p.min_stock_level';
    }

    if (outOfStock === true || outOfStock === 'true') {
      whereClause += ' AND COALESCE((SELECT SUM(quantity) FROM stock_levels sl WHERE sl.product_id = p.id), 0) = 0';
    }

    // Query to get count
    const countQuery = `SELECT COUNT(DISTINCT p.id) AS total FROM products p ${whereClause}`;
    const [countRows] = await pool.execute(countQuery, params);
    const totalCount = countRows[0].total;

    // Query to get paginated rows
    const dataQuery = `
      SELECT p.*, c.name AS category_name, s.name AS supplier_name,
             COALESCE((SELECT SUM(quantity) FROM stock_levels WHERE product_id = p.id), 0) AS total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

    return {
      rows,
      count: totalCount
    };
  }

  /**
   * Create a new product
   */
  static async create({ 
    sku, name, description, mrp = 0, purchase_price = 0, selling_price = 0, 
    gst_rate = 18.00, hsn_code = null, unit = 'Pieces', batch_number = null, 
    expiry_date = null, barcode = null, qr_code = null, minStockLevel = 10, 
    maxStockLevel = 100, imageUrl = null, categoryId = null, supplierId = null 
  }) {
    const query = `
      INSERT INTO products (sku, name, description, mrp, purchase_price, selling_price, gst_rate, hsn_code, unit, batch_number, expiry_date, barcode, qr_code, min_stock_level, max_stock_level, image_url, category_id, supplier_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      sku, name, description, mrp, purchase_price, selling_price, 
      gst_rate, hsn_code, unit, batch_number, expiry_date || null, 
      barcode, qr_code, minStockLevel, maxStockLevel, imageUrl, categoryId, supplierId
    ]);
    return result.insertId;
  }

  /**
   * Update a product record
   */
  static async update(id, { 
    sku, name, description, mrp, purchase_price, selling_price, 
    gst_rate, hsn_code, unit, batch_number, expiry_date, barcode, 
    qr_code, minStockLevel, maxStockLevel, imageUrl, categoryId = null, supplierId = null 
  }) {
    const query = `
      UPDATE products
      SET sku = ?, name = ?, description = ?, mrp = ?, purchase_price = ?, 
          selling_price = ?, gst_rate = ?, hsn_code = ?, unit = ?, batch_number = ?, 
          expiry_date = ?, barcode = ?, qr_code = ?, min_stock_level = ?, 
          max_stock_level = ?, image_url = ?, category_id = ?, supplier_id = ?
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [
      sku, name, description, mrp, purchase_price, selling_price, 
      gst_rate, hsn_code, unit, batch_number, expiry_date || null, 
      barcode, qr_code, minStockLevel, maxStockLevel, imageUrl, categoryId, supplierId, id
    ]);
    return result.affectedRows > 0;
  }

  /**
   * Delete a product
   */
  static async delete(id) {
    const query = 'DELETE FROM products WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Get stock location configurations for a product
   */
  static async getProductStockLevels(productId) {
    const query = `
      SELECT sl.quantity, sl.rack_number, w.name AS warehouse_name, w.warehouse_code
      FROM stock_levels sl
      JOIN warehouses w ON sl.warehouse_id = w.id
      WHERE sl.product_id = ?
    `;
    const [rows] = await pool.execute(query, [productId]);
    return rows;
  }

  /**
   * Get transaction history for a product
   */
  static async getProductTransactions(productId) {
    const query = `
      SELECT t.id, t.quantity, t.type, t.notes, t.invoice_number, t.po_number, t.created_at,
             u.username AS operator_name,
             wf.name AS from_warehouse, wf.warehouse_code AS from_warehouse_code,
             wt.name AS to_warehouse, wt.warehouse_code AS to_warehouse_code
      FROM stock_transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN warehouses wf ON t.from_warehouse_id = wf.id
      LEFT JOIN warehouses wt ON t.to_warehouse_id = wt.id
      WHERE t.product_id = ?
      ORDER BY t.created_at DESC
    `;
    const [rows] = await pool.execute(query, [productId]);
    return rows;
  }
}

export default Product;
