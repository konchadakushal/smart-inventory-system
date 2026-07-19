import { Router } from 'express';
import UserController from '../controllers/userController.js';
import { body } from 'express-validator';
import { checkValidation } from '../middleware/validationMiddleware.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all routes in this file to Admin only
router.use(authenticateUser, authorizeRoles('Admin'));

// GET /api/users - Get all users
router.get('/', UserController.getAll);

// POST /api/users - Create new user
router.post(
  '/',
  [
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role')
      .optional()
      .isIn(['Admin', 'Manager', 'Staff']).withMessage('Invalid role'),
    body('status')
      .optional()
      .isIn(['Active', 'Inactive']).withMessage('Invalid status'),
    body('warehouse_id')
      .optional({ nullable: true })
      .custom((value) => {
        if (value === '' || value === null) return true;
        if (isNaN(value)) throw new Error('Warehouse ID must be a number');
        return true;
      })
  ],
  checkValidation,
  UserController.create
);

// PUT /api/users/:id - Update user details
router.put(
  '/:id',
  [
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(['Admin', 'Manager', 'Staff']).withMessage('Invalid role'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['Active', 'Inactive']).withMessage('Invalid status'),
    body('warehouse_id')
      .optional({ nullable: true })
      .custom((value) => {
        if (value === '' || value === null) return true;
        if (isNaN(value)) throw new Error('Warehouse ID must be a number');
        return true;
      })
  ],
  checkValidation,
  UserController.update
);

// DELETE /api/users/:id - Delete user
router.delete('/:id', UserController.delete);

// POST /api/users/:id/reset-password - Administrative password reset
router.post(
  '/:id/reset-password',
  [
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  checkValidation,
  UserController.adminResetPassword
);

export default router;
