/**
 * Send a success response
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {object|array} data - Response payload data
 * @param {number} statusCode - HTTP status code (default 200)
 */
export const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send an error response
 * @param {object} res - Express response object
 * @param {string} message - Error explanation message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {object|array} errors - Detailed validation/structural errors (default null)
 */
export const sendError = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
