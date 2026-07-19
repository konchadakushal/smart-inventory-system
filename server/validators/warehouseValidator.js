import { body } from 'express-validator';

/**
 * Validation rules for creating or updating a warehouse
 */
export const warehouseValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Warehouse name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Warehouse name must be between 2 and 100 characters'),

  body('location')
    .trim()
    .notEmpty().withMessage('Warehouse location is required')
    .isLength({ min: 2, max: 255 }).withMessage('Location address must be between 2 and 255 characters'),

  body('capacity')
    .notEmpty().withMessage('Total unit capacity limit is required')
    .isInt({ min: 1 }).withMessage('Capacity must be an integer greater than or equal to 1'),

  body('warehouse_code')
    .trim()
    .notEmpty().withMessage('Warehouse code is required')
    .isLength({ min: 3, max: 50 }).withMessage('Warehouse code must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_\-]+$/).withMessage('Warehouse code can only contain letters, numbers, hyphens, and underscores')
];
