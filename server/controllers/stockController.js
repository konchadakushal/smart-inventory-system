import StockService from '../services/stockService.js';
import { sendSuccess } from '../utils/apiResponse.js';

class StockController {
  /**
   * Get all stock items inside a specific warehouse
   */
  static async getWarehouseStock(req, res, next) {
    try {
      const { warehouseId } = req.params;

      // Enforce Staff assigned warehouse restriction
      if (req.user.role === 'Staff' && req.user.warehouse_id && parseInt(warehouseId, 10) !== parseInt(req.user.warehouse_id, 10)) {
        const error = new Error('Access denied. You can only view stock levels inside your assigned warehouse.');
        error.statusCode = 403;
        throw error;
      }

      const stock = await StockService.getWarehouseStock(warehouseId);
      return sendSuccess(res, 'Warehouse stock levels loaded successfully', stock);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all warehouse locations storing a specific product
   */
  static async getProductLocations(req, res, next) {
    try {
      const { productId } = req.params;
      const locations = await StockService.getProductLocations(productId);
      return sendSuccess(res, 'Product location mappings loaded successfully', locations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all transaction logs (Audit Trail)
   */
  static async getLedgerHistory(req, res, next) {
    try {
      const history = await StockService.getLedgerHistory();
      return sendSuccess(res, 'Audit ledger logs retrieved successfully', history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record a new stock movement (IN, OUT, TRANSFER)
   */
  static async createMovement(req, res, next) {
    try {
      // req.user.id is attached by authenticateUser middleware
      const userId = req.user.id;
      const { product_id, from_warehouse_id, to_warehouse_id, quantity, type, notes, rack_number, invoice_number, po_number } = req.body;

      // Enforce Staff restrictions:
      // 1. Staff cannot perform stock TRANSFERS
      if (req.user.role === 'Staff' && type === 'TRANSFER') {
        const error = new Error('Access denied. Staff members are not authorized to perform stock transfers.');
        error.statusCode = 403;
        throw error;
      }

      // 2. Staff can only stock IN or OUT for their assigned warehouse
      if (req.user.role === 'Staff' && req.user.warehouse_id) {
        if (type === 'IN' && parseInt(to_warehouse_id, 10) !== parseInt(req.user.warehouse_id, 10)) {
          const error = new Error('Access denied. Staff can only stock IN to their assigned warehouse.');
          error.statusCode = 403;
          throw error;
        }
        if (type === 'OUT' && parseInt(from_warehouse_id, 10) !== parseInt(req.user.warehouse_id, 10)) {
          const error = new Error('Access denied. Staff can only stock OUT from their assigned warehouse.');
          error.statusCode = 403;
          throw error;
        }
      }

      const movementData = {
        productId: product_id,
        fromWarehouseId: from_warehouse_id,
        toWarehouseId: to_warehouse_id,
        quantity: quantity,
        type: type,
        notes: notes,
        rackNumber: rack_number || null,
        invoiceNumber: invoice_number || null,
        poNumber: po_number || null,
        userId
      };
      
      const result = await StockService.executeMovement(movementData);
      return sendSuccess(res, 'Stock movement executed successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }
}

export default StockController;
