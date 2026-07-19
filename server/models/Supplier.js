import pool from '../config/db.js';

class Supplier {
  /**
   * Find all suppliers
   */
  static async findAll() {
    const query = 'SELECT id, name, contact_name, email, phone, address, gstin, pan FROM suppliers ORDER BY name ASC';
    const [rows] = await pool.execute(query);
    return rows;
  }

  /**
   * Find supplier by ID
   */
  static async findById(id) {
    const query = 'SELECT id, name, contact_name, email, phone, address, gstin, pan FROM suppliers WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create a supplier
   */
  static async create({ name, contactName = '', email = '', phone = '', address = '', gstin = null, pan = null }) {
    const query = 'INSERT INTO suppliers (name, contact_name, email, phone, address, gstin, pan) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [result] = await pool.execute(query, [name, contactName, email, phone, address, gstin, pan]);
    return result.insertId;
  }

  /**
   * Update a supplier
   */
  static async update(id, { name, contactName, email, phone, address, gstin, pan }) {
    const query = 'UPDATE suppliers SET name = ?, contact_name = ?, email = ?, phone = ?, address = ?, gstin = ?, pan = ? WHERE id = ?';
    const [result] = await pool.execute(query, [name, contactName, email, phone, address, gstin, pan, id]);
    return result.affectedRows > 0;
  }

  /**
   * Delete a supplier
   */
  static async delete(id) {
    const query = 'DELETE FROM suppliers WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

export default Supplier;
