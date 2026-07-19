import Product from '../models/Product.js';
import StockService from './stockService.js';

class ProductService {
  /**
   * Fetch a list of products with filters and pagination
   */
  static async getProducts({ 
    search = '', 
    categoryId = null, 
    supplierId = null,
    warehouseId = null,
    lowStock = false,
    outOfStock = false,
    gstRate = null,
    page = 1, 
    limit = 10 
  }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    const parsedCategoryId = categoryId ? parseInt(categoryId, 10) : null;
    const parsedSupplierId = supplierId ? parseInt(supplierId, 10) : null;
    const parsedWarehouseId = warehouseId ? parseInt(warehouseId, 10) : null;

    const { rows, count } = await Product.findAndCount({
      search,
      categoryId: parsedCategoryId,
      supplierId: parsedSupplierId,
      warehouseId: parsedWarehouseId,
      lowStock,
      outOfStock,
      gstRate,
      limit: limitNum,
      offset
    });

    const totalPages = Math.ceil(count / limitNum);

    return {
      products: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: pageNum,
        limit: limitNum
      }
    };
  }

  /**
   * Fetch a specific product's details along with locations and stock movement history
   */
  static async getProductById(id) {
    const product = await Product.findById(id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    
    const stockLevels = await Product.getProductStockLevels(id);
    const stockHistory = await Product.getProductTransactions(id);

    return {
      ...product,
      stockLevels,
      stockHistory
    };
  }

  /**
   * Create a new product listing (handles optional initial stock injection)
   */
  static async createProduct(productData) {
    // Check for SKU collisions
    const existingSku = await Product.findBySku(productData.sku);
    if (existingSku) {
      const error = new Error(`Product with SKU code '${productData.sku}' already exists.`);
      error.statusCode = 400;
      throw error;
    }

    const insertedId = await Product.create({
      sku: productData.sku,
      name: productData.name,
      description: productData.description || '',
      mrp: productData.mrp,
      purchase_price: productData.purchase_price,
      selling_price: productData.selling_price,
      gst_rate: productData.gst_rate || 18.00,
      hsn_code: productData.hsn_code || null,
      unit: productData.unit || 'Pieces',
      batch_number: productData.batch_number || null,
      expiry_date: productData.expiry_date || null,
      barcode: productData.barcode || null,
      qr_code: productData.qr_code || null,
      minStockLevel: productData.min_stock_level || 10,
      maxStockLevel: productData.max_stock_level || 100,
      imageUrl: productData.image_url || null,
      categoryId: productData.category_id || null,
      supplierId: productData.supplier_id || null
    });

    // Handle initial stock allocation
    const initialQty = parseInt(productData.current_stock, 10);
    const warehouseId = parseInt(productData.warehouse_id, 10);
    if (initialQty > 0 && warehouseId > 0) {
      await StockService.executeMovement({
        productId: insertedId,
        toWarehouseId: warehouseId,
        quantity: initialQty,
        type: 'IN',
        userId: productData.user_id || null,
        notes: 'Initial inventory load on product registration.',
        rackNumber: productData.rack_number || null,
        invoiceNumber: 'INIT-LOAD',
        poNumber: 'INIT-PO'
      });
    }

    return this.getProductById(insertedId);
  }

  /**
   * Update product properties
   */
  static async updateProduct(id, productData) {
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if SKU is changing and conflicts with another product
    if (productData.sku !== existingProduct.sku) {
      const conflictingSku = await Product.findBySku(productData.sku);
      if (conflictingSku && conflictingSku.id !== parseInt(id, 10)) {
        const error = new Error(`SKU code '${productData.sku}' is already taken by another product.`);
        error.statusCode = 400;
        throw error;
      }
    }

    await Product.update(id, {
      sku: productData.sku,
      name: productData.name,
      description: productData.description || '',
      mrp: productData.mrp,
      purchase_price: productData.purchase_price,
      selling_price: productData.selling_price,
      gst_rate: productData.gst_rate,
      hsn_code: productData.hsn_code,
      unit: productData.unit,
      batch_number: productData.batch_number,
      expiry_date: productData.expiry_date,
      barcode: productData.barcode,
      qr_code: productData.qr_code,
      minStockLevel: productData.min_stock_level || 10,
      maxStockLevel: productData.max_stock_level || 100,
      imageUrl: productData.image_url || null,
      categoryId: productData.category_id || null,
      supplierId: productData.supplier_id || null
    });

    return this.getProductById(id);
  }

  /**
   * Remove a product from the database
   */
  static async deleteProduct(id) {
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    return await Product.delete(id);
  }

  /**
   * Process Stock Inward movement
   */
  static async stockIn({ productId, quantity, warehouseId, invoiceNumber, notes, userId }) {
    return await StockService.executeMovement({
      productId,
      toWarehouseId: warehouseId,
      quantity,
      type: 'IN',
      userId,
      notes: notes || 'Product stock inward transaction',
      invoiceNumber
    });
  }

  /**
   * Process Stock Outward movement
   */
  static async stockOut({ productId, quantity, warehouseId, notes, userId }) {
    return await StockService.executeMovement({
      productId,
      fromWarehouseId: warehouseId,
      quantity,
      type: 'OUT',
      userId,
      notes: notes || 'Product stock dispatch transaction'
    });
  }

  /**
   * Duplicate existing product
   */
  static async duplicateProduct(id, userId) {
    const source = await Product.findById(id);
    if (!source) {
      const error = new Error('Source product to duplicate not found');
      error.statusCode = 404;
      throw error;
    }

    // Create unique SKU for duplicated product
    const timestamp = Date.now().toString().slice(-4);
    const newSku = `${source.sku}-DUP-${timestamp}`;

    const duplicateId = await Product.create({
      sku: newSku,
      name: `${source.name} (Copy)`,
      description: source.description,
      mrp: source.mrp,
      purchase_price: source.purchase_price,
      selling_price: source.selling_price,
      gst_rate: source.gst_rate,
      hsn_code: source.hsn_code,
      unit: source.unit,
      batch_number: source.batch_number,
      expiry_date: source.expiry_date,
      barcode: source.barcode ? `${source.barcode}-${timestamp}` : null,
      qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${newSku}`,
      minStockLevel: source.min_stock_level,
      maxStockLevel: source.max_stock_level,
      imageUrl: source.image_url,
      categoryId: source.category_id,
      supplierId: source.supplier_id
    });

    return this.getProductById(duplicateId);
  }

  /**
   * Quick search catalog
   */
  static async searchProducts(search) {
    const { rows } = await Product.findAndCount({ search, limit: 20 });
    return rows;
  }

  /**
   * Export all items
   */
  static async exportAll() {
    const { rows } = await Product.findAndCount({ limit: 10000 });
    return rows;
  }
}

export default ProductService;
