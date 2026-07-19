import { Router } from 'express';
import WarehouseController from '../controllers/warehouseController.js';
import { warehouseValidator } from '../validators/warehouseValidator.js';
import { checkValidation } from '../middleware/validationMiddleware.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Route: GET /api/warehouses
router.get('/', authenticateUser, WarehouseController.getAll);

// Route: GET /api/warehouses/:id
router.get('/:id', authenticateUser, WarehouseController.getById);

// Route: POST /api/warehouses
router.post(
  '/', 
  authenticateUser, 
  authorizeRoles('Admin', 'Manager'), 
  warehouseValidator, 
  checkValidation, 
  WarehouseController.create
);

// Route: PUT /api/warehouses/:id
router.put(
  '/:id', 
  authenticateUser, 
  authorizeRoles('Admin', 'Manager'), 
  warehouseValidator, 
  checkValidation, 
  WarehouseController.update
);

// Route: DELETE /api/warehouses/:id
router.delete(
  '/:id', 
  authenticateUser, 
  authorizeRoles('Admin'), 
  WarehouseController.delete
);

export default router;
