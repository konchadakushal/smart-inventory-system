import pool from '../config/db.js';

class Category {
  /**
   * Find all categories
   */
  static async findAll() {
    const query = 'SELECT id, name, description FROM categories ORDER BY name ASC';
    const [rows] = await pool.execute(query);
    return rows;
  }
}

export default Category;
