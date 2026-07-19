import { verifyToken } from '../utils/jwtHelper.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Middleware to authenticate requests using JWT tokens
 */
export const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access denied. No authentication token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'Access denied. Token is malformed.', 401);
    }

    const decoded = verifyToken(token);
    req.user = decoded; // Attach user payload ({ id, username, role }) to request
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please log in again.', 401);
    }
    return sendError(res, 'Authentication failed. Invalid token.', 401);
  }
};

/**
 * Middleware to restrict route access to specific user roles
 * @param {...string} roles - List of roles permitted (e.g., 'Admin', 'Manager')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(
        res, 
        `Access denied. Requires one of the following roles: ${roles.join(', ')}`, 
        403
      );
    }
    next();
  };
};
