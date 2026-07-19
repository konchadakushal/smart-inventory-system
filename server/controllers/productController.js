import ProductService from '../services/productService.js';
import { sendSuccess } from '../utils/apiResponse.js';

class ProductController {
  /**
   * Get all products with filters, search, and pagination
   */
  static async getAll(req, res, next) {
    try {
      const { 
        search, 
        categoryId, 
        supplierId,
        warehouseId,
        lowStock,
        outOfStock,
        gstRate,
        page, 
        limit 
      } = req.query;

      const result = await ProductService.getProducts({ 
        search, 
        categoryId, 
        supplierId,
        warehouseId,
        lowStock: lowStock === 'true',
        outOfStock: outOfStock === 'true',
        gstRate,
        page, 
        limit 
      });

      return sendSuccess(res, 'Products retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single product details by ID (including locations & transactions)
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);
      return sendSuccess(res, 'Product retrieved successfully', product);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new product listing (accepts initial stock levels)
   */
  static async create(req, res, next) {
    try {
      const payload = {
        ...req.body,
        user_id: req.user ? req.user.id : null
      };
      const product = await ProductService.createProduct(payload);
      return sendSuccess(res, 'Product created successfully', product, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing product properties
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const product = await ProductService.updateProduct(id, req.body);
      return sendSuccess(res, 'Product updated successfully', product);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a product record
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      await ProductService.deleteProduct(id);
      return sendSuccess(res, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Stock Inward transaction intake
   */
  static async stockIn(req, res, next) {
    try {
      const { productId, quantity, warehouseId, invoiceNumber, notes } = req.body;
      const userId = req.user ? req.user.id : null;
      
      const result = await ProductService.stockIn({
        productId,
        quantity,
        warehouseId,
        invoiceNumber,
        notes,
        userId
      });

      return sendSuccess(res, 'Stock inward transaction processed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Stock Outward transaction dispatch
   */
  static async stockOut(req, res, next) {
    try {
      const { productId, quantity, warehouseId, notes } = req.body;
      const userId = req.user ? req.user.id : null;
      
      const result = await ProductService.stockOut({
        productId,
        quantity,
        warehouseId,
        notes,
        userId
      });

      return sendSuccess(res, 'Stock dispatch transaction processed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicate a product listing
   */
  static async duplicate(req, res, next) {
    try {
      const { productId } = req.body;
      const userId = req.user ? req.user.id : null;
      
      const product = await ProductService.duplicateProduct(productId, userId);
      return sendSuccess(res, 'Product duplicated successfully', product, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search catalog products
   */
  static async searchProducts(req, res, next) {
    try {
      const { q } = req.query;
      const products = await ProductService.searchProducts(q);
      return sendSuccess(res, 'Products searched successfully', products);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export product records
   */
  static async exportProducts(req, res, next) {
    try {
      const products = await ProductService.exportAll();
      return sendSuccess(res, 'Product list exported successfully', products);
    } catch (error) {
      next(error);
    }
  }
}

export default ProductController;
