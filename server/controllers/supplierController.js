import SupplierService from '../services/supplierService.js';
import { sendSuccess } from '../utils/apiResponse.js';

class SupplierController {
  static async getAll(req, res, next) {
    try {
      const suppliers = await SupplierService.getSuppliers();
      return sendSuccess(res, 'Suppliers retrieved successfully', suppliers);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const supplier = await SupplierService.getSupplierById(id);
      return sendSuccess(res, 'Supplier retrieved successfully', supplier);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get products supplied by a specific vendor (Supply History)
   */
  static async getProducts(req, res, next) {
    try {
      const { id } = req.params;
      const products = await SupplierService.getSupplierProducts(id);
      return sendSuccess(res, 'Supplier product history retrieved successfully', products);
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const supplier = await SupplierService.createSupplier(req.body);
      return sendSuccess(res, 'Supplier created successfully', supplier, 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const supplier = await SupplierService.updateSupplier(id, req.body);
      return sendSuccess(res, 'Supplier updated successfully', supplier);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      await SupplierService.deleteSupplier(id);
      return sendSuccess(res, 'Supplier deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default SupplierController;
