import { validationResult } from 'express-validator';
import { sendError } from '../utils/apiResponse.js';

/**
 * Middleware to check validation results from express-validator.
 * Returns 400 Bad Request if validation rules fail.
 */
export const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Standardize validation error details
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));
    
    return sendError(res, 'Validation failed. Please correct the fields.', 400, formattedErrors);
  }
  next();
};
