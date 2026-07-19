import { Router } from 'express';
import DashboardController from '../controllers/dashboardController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();

// Route: GET /api/dashboard
// Restricted to authenticated accounts
router.get('/', authenticateUser, DashboardController.getOverview);

export default router;
