import { body } from 'express-validator';

/**
 * Validation rules for recording stock movements (inflow, outflow, transfers)
 */
export const stockMovementValidator = [
  body('product_id')
    .notEmpty().withMessage('Product selection is required')
    .isInt().withMessage('Invalid product selection'),

  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be a positive integer greater than 0'),

  body('type')
    .notEmpty().withMessage('Movement type is required')
    .isIn(['IN', 'OUT', 'TRANSFER']).withMessage('Movement type must be IN, OUT, or TRANSFER'),

  body('from_warehouse_id')
    .if(body('type').isIn(['OUT', 'TRANSFER']))
    .notEmpty().withMessage('Source warehouse is required for outflows or transfers')
    .isInt().withMessage('Invalid source warehouse selection'),

  body('to_warehouse_id')
    .if(body('type').isIn(['IN', 'TRANSFER']))
    .notEmpty().withMessage('Destination warehouse is required for inflows or transfers')
    .isInt().withMessage('Invalid destination warehouse selection')
    .custom((value, { req }) => {
      if (req.body.type === 'TRANSFER' && parseInt(value, 10) === parseInt(req.body.from_warehouse_id, 10)) {
        throw new Error('Source and destination warehouses must be different for transfers');
      }
      return true;
    }),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Notes cannot exceed 255 characters'),

  body('rack_number')
    .optional()
    .trim(),

  body('invoice_number')
    .optional()
    .trim(),

  body('po_number')
    .optional()
    .trim()
];
