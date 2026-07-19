import { Router } from 'express';
import CategoryController from '../controllers/categoryController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();

// Route: GET /api/categories
router.get('/', authenticateUser, CategoryController.getAll);

export default router;
