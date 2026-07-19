import { Router } from 'express';
import ProductController from '../controllers/productController.js';
import { productValidator } from '../validators/productValidator.js';
import { checkValidation } from '../middleware/validationMiddleware.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Route: GET /api/products/export
// Export list of products (Protected, Admin & Manager only)
router.get('/export', authenticateUser, authorizeRoles('Admin', 'Manager'), ProductController.exportProducts);

// Route: GET /api/products/search
// Search products (Protected, accessible to all logged-in users)
router.get('/search', authenticateUser, ProductController.searchProducts);

// Route: GET /api/products
// Fetch list of products (Protected, accessible to all logged-in users)
router.get('/', authenticateUser, ProductController.getAll);

// Route: GET /api/products/:id
// Fetch single product details (Protected)
router.get('/:id', authenticateUser, ProductController.getById);

// Route: POST /api/products
// Create new product (Protected, Admin & Manager only)
router.post(
  '/', 
  authenticateUser, 
  authorizeRoles('Admin', 'Manager'), 
  productValidator, 
  checkValidation, 
  ProductController.create
);

// Route: PUT /api/products/:id
// Update product attributes (Protected, Admin & Manager only)
router.put(
  '/:id', 
  authenticateUser, 
  authorizeRoles('Admin', 'Manager'), 
  productValidator, 
  checkValidation, 
  ProductController.update
);

// Route: DELETE /api/products/:id
// Delete product record (Protected, Admin only)
router.delete(
  '/:id', 
  authenticateUser, 
  authorizeRoles('Admin'), 
  ProductController.delete
);

// Route: POST /api/products/stock-in
// Perform stock placement operation (Protected, Admin, Manager & Staff)
router.post('/stock-in', authenticateUser, ProductController.stockIn);

// Route: POST /api/products/stock-out
// Perform stock outflow dispatch operation (Protected, Admin, Manager & Staff)
router.post('/stock-out', authenticateUser, ProductController.stockOut);

// Route: POST /api/products/duplicate
// Duplicate a product to create a clone (Protected, Admin & Manager)
router.post('/duplicate', authenticateUser, authorizeRoles('Admin', 'Manager'), ProductController.duplicate);

export default router;
