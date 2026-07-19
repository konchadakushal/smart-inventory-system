import pool from '../config/db.js';

class Warehouse {
  /**
   * Find all warehouses, including total items currently stored
   */
  static async findAll() {
    const query = `
      SELECT w.*, 
             COALESCE((SELECT SUM(quantity) FROM stock_levels WHERE warehouse_id = w.id), 0) AS current_stock_count
      FROM warehouses w
      ORDER BY w.name ASC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  }

  /**
   * Find a warehouse by its ID
   */
  static async findById(id) {
    const query = `
      SELECT w.*,
             COALESCE((SELECT SUM(quantity) FROM stock_levels WHERE warehouse_id = w.id), 0) AS current_stock_count
      FROM warehouses w
      WHERE w.id = ?
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create a new warehouse
   */
  static async create({ name, location, capacity, warehouse_code }) {
    const query = 'INSERT INTO warehouses (name, location, capacity, warehouse_code) VALUES (?, ?, ?, ?)';
    const [result] = await pool.execute(query, [name, location, capacity, warehouse_code]);
    return result.insertId;
  }

  /**
   * Update warehouse details
   */
  static async update(id, { name, location, capacity, warehouse_code }) {
    const query = 'UPDATE warehouses SET name = ?, location = ?, capacity = ?, warehouse_code = ? WHERE id = ?';
    const [result] = await pool.execute(query, [name, location, capacity, warehouse_code, id]);
    return result.affectedRows > 0;
  }

  /**
   * Delete a warehouse
   */
  static async delete(id) {
    const query = 'DELETE FROM warehouses WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

export default Warehouse;
