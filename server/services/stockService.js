import pool from '../config/db.js';
import Stock from '../models/Stock.js';
import Warehouse from '../models/Warehouse.js';
import Product from '../models/Product.js';

class StockService {
  static async getWarehouseStock(warehouseId) {
    // Validate warehouse presence
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      const error = new Error('Warehouse not found');
      error.statusCode = 404;
      throw error;
    }
    return await Stock.findByWarehouse(warehouseId);
  }

  static async getProductLocations(productId) {
    // Validate product presence
    const product = await Product.findById(productId);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    return await Stock.findByProduct(productId);
  }

  static async getLedgerHistory() {
    return await Stock.getTransactionHistory();
  }

  /**
   * Execute an inventory movement (IN, OUT, or TRANSFER) atomically within a SQL transaction block
   */
  static async executeMovement({ productId, fromWarehouseId, toWarehouseId, quantity, type, userId, notes, rackNumber = null, invoiceNumber = null, poNumber = null }) {
    const qty = parseInt(quantity, 10);
    
    // 1. Fetch transaction connection from pool
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 2. Validate product exists
      const product = await Product.findById(productId);
      if (!product) {
        const error = new Error('Product not found in system catalog.');
        error.statusCode = 404;
        throw error;
      }

      // 3. Coordinate based on transaction type
      if (type === 'IN') {
        const target = await Warehouse.findById(toWarehouseId);
        if (!target) {
          const error = new Error('Destination warehouse not found.');
          error.statusCode = 404;
          throw error;
        }

        // Capacity audit check: Sum of current items stored + quantity cannot exceed capacity
        const currentLoad = parseInt(target.current_stock_count, 10);
        const limit = parseInt(target.capacity, 10);
        if (currentLoad + qty > limit) {
          const error = new Error(`Warehouse Capacity Exceeded! Cannot add ${qty} units. Space left: ${limit - currentLoad} units.`);
          error.statusCode = 400;
          throw error;
        }

        // Adjust stock level up
        await Stock.adjustQuantity(connection, toWarehouseId, productId, qty, rackNumber);
        // Write audit log
        await Stock.createTransaction(connection, {
          productId,
          toWarehouseId,
          quantity: qty,
          type,
          userId,
          notes,
          invoiceNumber,
          poNumber
        });

      } else if (type === 'OUT') {
        const source = await Warehouse.findById(fromWarehouseId);
        if (!source) {
          const error = new Error('Source warehouse not found.');
          error.statusCode = 404;
          throw error;
        }

        // Sufficiency check: verify warehouse has enough stock (use Row-lock for safe check)
        const currentStock = await Stock.getQuantity(connection, fromWarehouseId, productId, true);
        if (currentStock < qty) {
          const error = new Error(`Insufficient Stock! Source warehouse only has ${currentStock} units of product '${product.name}'.`);
          error.statusCode = 400;
          throw error;
        }

        // Adjust stock level down (subtracting)
        await Stock.adjustQuantity(connection, fromWarehouseId, productId, -qty);
        // Write audit log
        await Stock.createTransaction(connection, {
          productId,
          fromWarehouseId,
          quantity: qty,
          type,
          userId,
          notes,
          invoiceNumber,
          poNumber
        });

      } else if (type === 'TRANSFER') {
        const source = await Warehouse.findById(fromWarehouseId);
        const target = await Warehouse.findById(toWarehouseId);

        if (!source || !target) {
          const error = new Error('Source or Destination warehouse not found.');
          error.statusCode = 404;
          throw error;
        }

        // Sufficiency check on source warehouse
        const currentSourceStock = await Stock.getQuantity(connection, fromWarehouseId, productId, true);
        if (currentSourceStock < qty) {
          const error = new Error(`Insufficient Stock! Source warehouse only has ${currentSourceStock} units of product '${product.name}'.`);
          error.statusCode = 400;
          throw error;
        }

        // Capacity audit check on target warehouse
        const currentTargetLoad = parseInt(target.current_stock_count, 10);
        const limit = parseInt(target.capacity, 10);
        if (currentTargetLoad + qty > limit) {
          const error = new Error(`Target Warehouse Capacity Exceeded! Cannot transfer ${qty} units. Space left: ${limit - currentTargetLoad} units.`);
          error.statusCode = 400;
          throw error;
        }

        // Deduct from source and add to destination
        await Stock.adjustQuantity(connection, fromWarehouseId, productId, -qty);
        await Stock.adjustQuantity(connection, toWarehouseId, productId, qty, rackNumber);
        
        // Write audit log linking both warehouse IDs
        await Stock.createTransaction(connection, {
          productId,
          fromWarehouseId,
          toWarehouseId,
          quantity: qty,
          type,
          userId,
          notes,
          invoiceNumber,
          poNumber
        });
      }

      // 4. Commit transaction
      await connection.commit();
      return { success: true, message: 'Stock movement executed successfully.' };

    } catch (error) {
      // Rollback transaction on errors
      await connection.rollback();
      throw error;
    } finally {
      // Release pool connection
      connection.release();
    }
  }
}

export default StockService;
