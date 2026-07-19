import { Router } from 'express';
import StockController from '../controllers/stockController.js';
import { stockMovementValidator } from '../validators/stockValidator.js';
import { checkValidation } from '../middleware/validationMiddleware.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();

// Route: GET /api/stock/warehouse/:warehouseId
router.get('/warehouse/:warehouseId', authenticateUser, StockController.getWarehouseStock);

// Route: GET /api/stock/product/:productId
router.get('/product/:productId', authenticateUser, StockController.getProductLocations);

// Route: GET /api/stock/history
router.get('/history', authenticateUser, StockController.getLedgerHistory);

// Route: POST /api/stock/move
// Protected route for operators/managers/admins to execute stock transactions
router.post('/move', authenticateUser, stockMovementValidator, checkValidation, StockController.createMovement);

export default router;
