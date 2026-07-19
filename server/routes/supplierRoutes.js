import { Router } from 'express';
import SupplierController from '../controllers/supplierController.js';
import { supplierValidator } from '../validators/supplierValidator.js';
import { checkValidation } from '../middleware/validationMiddleware.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Route: GET /api/suppliers
router.get('/', authenticateUser, SupplierController.getAll);

// Route: GET /api/suppliers/:id
router.get('/:id', authenticateUser, SupplierController.getById);

// Route: GET /api/suppliers/:id/products (Product Supply History)
router.get('/:id/products', authenticateUser, SupplierController.getProducts);

// Route: POST /api/suppliers
router.post(
  '/', 
  authenticateUser, 
  authorizeRoles('Admin', 'Manager'), 
  supplierValidator, 
  checkValidation, 
  SupplierController.create
);

// Route: PUT /api/suppliers/:id
router.put(
  '/:id', 
  authenticateUser, 
  authorizeRoles('Admin', 'Manager'), 
  supplierValidator, 
  checkValidation, 
  SupplierController.update
);

// Route: DELETE /api/suppliers/:id
router.delete(
  '/:id', 
  authenticateUser, 
  authorizeRoles('Admin'), 
  SupplierController.delete
);

export default router;
