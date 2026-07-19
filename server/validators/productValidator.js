import { body } from 'express-validator';

/**
 * Validation rules for creating or updating a product
 */
export const productValidator = [
  body('sku')
    .trim()
    .notEmpty().withMessage('SKU code is required')
    .isLength({ min: 3, max: 50 }).withMessage('SKU code must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_\-]+$/).withMessage('SKU code can only contain letters, numbers, hyphens, and underscores'),

  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Product name must be between 2 and 100 characters'),

  body('description')
    .optional()
    .trim(),

  body('mrp')
    .notEmpty().withMessage('MRP is required')
    .isFloat({ min: 0 }).withMessage('MRP must be a number greater than or equal to 0'),

  body('purchase_price')
    .notEmpty().withMessage('Purchase Price is required')
    .isFloat({ min: 0 }).withMessage('Purchase Price must be a number greater than or equal to 0'),

  body('selling_price')
    .notEmpty().withMessage('Selling Price is required')
    .isFloat({ min: 0 }).withMessage('Selling Price must be a number greater than or equal to 0'),

  body('gst_rate')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('GST Rate must be between 0 and 100'),

  body('hsn_code')
    .optional()
    .trim(),

  body('unit')
    .optional()
    .isIn(['Pieces', 'Boxes', 'Cartons']).withMessage('Invalid unit. Must be Pieces, Boxes, or Cartons'),

  body('batch_number')
    .optional()
    .trim(),

  body('expiry_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('Expiry Date must be a valid YYYY-MM-DD date'),

  body('min_stock_level')
    .optional()
    .isInt({ min: 0 }).withMessage('Minimum stock level threshold must be an integer greater than or equal to 0'),

  body('max_stock_level')
    .optional()
    .isInt({ min: 0 }).withMessage('Maximum stock level threshold must be an integer greater than or equal to 0'),

  body('image_url')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('category_id')
    .optional({ nullable: true })
    .isInt().withMessage('Category selection is invalid'),

  body('supplier_id')
    .optional({ nullable: true })
    .isInt().withMessage('Supplier selection is invalid')
];
