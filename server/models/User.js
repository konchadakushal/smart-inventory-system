import pool from '../config/db.js';

class User {
  /**
   * Find a user by their email address
   * @param {string} email 
   * @returns {Promise<object|null>} The user record or null
   */
  static async findByEmail(email) {
    const query = 'SELECT id, username, email, password_hash, role, profile_picture, status, warehouse_id, reset_token, reset_token_expires_at, created_at FROM users WHERE email = ?';
    const [rows] = await pool.execute(query, [email]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find a user by their username
   * @param {string} username 
   * @returns {Promise<object|null>} The user record or null
   */
  static async findByUsername(username) {
    const query = 'SELECT id, username, email, password_hash, role, profile_picture, status, warehouse_id, created_at FROM users WHERE username = ?';
    const [rows] = await pool.execute(query, [username]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find a user by their unique ID
   * @param {number} id 
   * @returns {Promise<object|null>} The user record (excluding password_hash) or null
   */
  static async findById(id) {
    const query = 'SELECT id, username, email, role, profile_picture, status, warehouse_id, created_at FROM users WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create a new user in the database
   * @param {object} userData - { username, email, passwordHash, role, status, warehouseId, profilePicture }
   * @returns {Promise<number>} The ID of the newly inserted user
   */
  static async create({ username, email, passwordHash, role = 'Staff', status = 'Active', warehouseId = null, profilePicture = null }) {
    const query = 'INSERT INTO users (username, email, password_hash, role, status, warehouse_id, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [result] = await pool.execute(query, [username, email, passwordHash, role, status, warehouseId, profilePicture]);
    return result.insertId;
  }

  /**
   * Find all users (Admin view)
   * @returns {Promise<array>} Array of user records
   */
  static async findAll() {
    const query = `
      SELECT u.id, u.username, u.email, u.role, u.status, u.warehouse_id, u.profile_picture, u.created_at,
             w.name AS warehouse_name
      FROM users u
      LEFT JOIN warehouses w ON u.warehouse_id = w.id
      ORDER BY u.created_at DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  }

  /**
   * Update a user's role
   * @param {number} id 
   * @param {string} role 
   * @returns {Promise<boolean>} True if role was updated
   */
  static async updateRole(id, role) {
    const query = 'UPDATE users SET role = ? WHERE id = ?';
    const [result] = await pool.execute(query, [role, id]);
    return result.affectedRows > 0;
  }

  /**
   * Delete a user record
   * @param {number} id 
   * @returns {Promise<boolean>} True if user was deleted
   */
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Update reset token and expiration for password recovery
   */
  static async updateResetToken(email, token, expiresAt) {
    const query = 'UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE email = ?';
    const [result] = await pool.execute(query, [token, expiresAt, email]);
    return result.affectedRows > 0;
  }

  /**
   * Find a user by their reset token
   */
  static async findByResetToken(token) {
    const query = 'SELECT id, username, email, password_hash, role, status, reset_token_expires_at FROM users WHERE reset_token = ?';
    const [rows] = await pool.execute(query, [token]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Update password and invalidate reset token in a single query
   */
  static async updatePasswordAndInvalidateToken(userId, hashedPassword) {
    const query = 'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?';
    const [result] = await pool.execute(query, [hashedPassword, userId]);
    return result.affectedRows > 0;
  }

  /**
   * Update general user details (Admin management)
   */
  static async updateUser(id, { username, email, role, status, warehouse_id }) {
    const query = 'UPDATE users SET username = ?, email = ?, role = ?, status = ?, warehouse_id = ? WHERE id = ?';
    const [result] = await pool.execute(query, [username, email, role, status, warehouse_id, id]);
    return result.affectedRows > 0;
  }

  /**
   * Reset user password to a new hash
   */
  static async updatePassword(id, hashedPassword) {
    const query = 'UPDATE users SET password_hash = ? WHERE id = ?';
    const [result] = await pool.execute(query, [hashedPassword, id]);
    return result.affectedRows > 0;
  }
}

export default User;
