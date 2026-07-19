import WarehouseService from '../services/warehouseService.js';
import { sendSuccess } from '../utils/apiResponse.js';

class WarehouseController {
  static async getAll(req, res, next) {
    try {
      const warehouses = await WarehouseService.getWarehouses(req.user);
      return sendSuccess(res, 'Warehouses retrieved successfully', warehouses);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      
      // Staff restriction
      if (req.user.role === 'Staff' && req.user.warehouse_id && parseInt(id, 10) !== parseInt(req.user.warehouse_id, 10)) {
        const error = new Error('Access denied. You can only view details of your assigned warehouse.');
        error.statusCode = 403;
        throw error;
      }

      const warehouse = await WarehouseService.getWarehouseById(id);
      return sendSuccess(res, 'Warehouse retrieved successfully', warehouse);
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const warehouse = await WarehouseService.createWarehouse(req.body);
      return sendSuccess(res, 'Warehouse created successfully', warehouse, 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const warehouse = await WarehouseService.updateWarehouse(id, req.body);
      return sendSuccess(res, 'Warehouse updated successfully', warehouse);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      await WarehouseService.deleteWarehouse(id);
      return sendSuccess(res, 'Warehouse deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default WarehouseController;
