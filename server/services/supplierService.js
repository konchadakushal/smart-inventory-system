import Supplier from '../models/Supplier.js';
import pool from '../config/db.js';

class SupplierService {
  static async getSuppliers() {
    return await Supplier.findAll();
  }

  static async getSupplierById(id) {
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      const error = new Error('Supplier not found');
      error.statusCode = 404;
      throw error;
    }
    return supplier;
  }

  /**
   * Fetch list of products associated with a specific supplier (Product History)
   */
  static async getSupplierProducts(supplierId) {
    // Verify supplier exists first
    await this.getSupplierById(supplierId);

    const query = `
      SELECT p.*, c.name AS category_name,
             COALESCE((SELECT SUM(quantity) FROM stock_levels WHERE product_id = p.id), 0) AS total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.supplier_id = ?
      ORDER BY p.created_at DESC
    `;
    const [rows] = await pool.execute(query, [supplierId]);
    return rows;
  }

  static async createSupplier(data) {
    if (!data.name) {
      const error = new Error('Supplier name is required');
      error.statusCode = 400;
      throw error;
    }
    const insertedId = await Supplier.create({
      name: data.name,
      contactName: data.contact_name || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      gstin: data.gstin || null,
      pan: data.pan || null
    });
    return this.getSupplierById(insertedId);
  }

  static async updateSupplier(id, data) {
    const existing = await Supplier.findById(id);
    if (!existing) {
      const error = new Error('Supplier not found');
      error.statusCode = 404;
      throw error;
    }
    await Supplier.update(id, {
      name: data.name,
      contactName: data.contact_name || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      gstin: data.gstin || null,
      pan: data.pan || null
    });
    return this.getSupplierById(id);
  }

  static async deleteSupplier(id) {
    const existing = await Supplier.findById(id);
    if (!existing) {
      const error = new Error('Supplier not found');
      error.statusCode = 404;
      throw error;
    }
    return await Supplier.delete(id);
  }
}

export default SupplierService;
