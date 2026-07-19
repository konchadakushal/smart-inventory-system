import Warehouse from '../models/Warehouse.js';

class WarehouseService {
  static async getWarehouses(user) {
    if (user && user.role === 'Staff' && user.warehouse_id) {
      const warehouse = await Warehouse.findById(user.warehouse_id);
      return warehouse ? [warehouse] : [];
    }
    return await Warehouse.findAll();
  }

  static async getWarehouseById(id) {
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      const error = new Error('Warehouse not found');
      error.statusCode = 404;
      throw error;
    }
    return warehouse;
  }

  static async createWarehouse(data) {
    const insertedId = await Warehouse.create({
      name: data.name,
      location: data.location,
      capacity: parseInt(data.capacity, 10),
      warehouse_code: data.warehouse_code
    });
    return this.getWarehouseById(insertedId);
  }

  static async updateWarehouse(id, data) {
    const existing = await Warehouse.findById(id);
    if (!existing) {
      const error = new Error('Warehouse not found');
      error.statusCode = 404;
      throw error;
    }

    // Capacity check: Cannot shrink a warehouse capacity to less than its current items load
    const currentStock = parseInt(existing.current_stock_count, 10);
    const newCapacity = parseInt(data.capacity, 10);
    if (newCapacity < currentStock) {
      const error = new Error(`Cannot shrink capacity to ${newCapacity} units. Currently storing ${currentStock} units.`);
      error.statusCode = 400;
      throw error;
    }

    await Warehouse.update(id, {
      name: data.name,
      location: data.location,
      capacity: newCapacity,
      warehouse_code: data.warehouse_code
    });
    return this.getWarehouseById(id);
  }

  static async deleteWarehouse(id) {
    const existing = await Warehouse.findById(id);
    if (!existing) {
      const error = new Error('Warehouse not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Safety check: Don't delete a warehouse that still holds stock items
    if (parseInt(existing.current_stock_count, 10) > 0) {
      const error = new Error('Cannot delete a warehouse that still holds active stock. Please clear/transfer all items first.');
      error.statusCode = 400;
      throw error;
    }

    return await Warehouse.delete(id);
  }
}

export default WarehouseService;
