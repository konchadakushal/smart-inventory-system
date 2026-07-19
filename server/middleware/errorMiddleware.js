// Centralized Error Handling Middleware for Express

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error stack trace for debugging
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.stack || err);

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
    // Only include stack trace in development mode
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// Middleware for 404 Not Found handling
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
