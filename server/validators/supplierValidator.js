import { body } from 'express-validator';

/**
 * Validation rules for creating or updating a supplier
 */
export const supplierValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Supplier name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Supplier name must be between 2 and 100 characters'),

  body('contact_name')
    .optional()
    .trim(),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^(?:\+91|0)?[6-9]\d{9}$/).withMessage('Please provide a valid Indian phone number (+91 or 10 digits)'),

  body('address')
    .optional()
    .trim(),

  body('gstin')
    .optional({ checkFalsy: true })
    .trim()
    .toUpperCase()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Please provide a valid 15-digit GSTIN (e.g., 29AAAAA1111A1Z1)'),

  body('pan')
    .optional({ checkFalsy: true })
    .trim()
    .toUpperCase()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Please provide a valid 10-digit PAN (e.g., ABCDE1234F)')
];
