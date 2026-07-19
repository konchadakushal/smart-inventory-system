import AuthService from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { verifyToken } from '../utils/jwtHelper.js';

class AuthController {
  /**
   * Register a new user
   */
  static async register(req, res, next) {
    try {
      const { username, email, password, role } = req.body;
      
      // Enforce: Allow users to choose only the Staff role during registration.
      // Only Admin users can create other Admin/Manager accounts.
      const targetRole = role || 'Staff';
      if (targetRole !== 'Staff') {
        let isAdmin = false;
        try {
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token) {
              const decoded = verifyToken(token);
              if (decoded && decoded.role === 'Admin') {
                isAdmin = true;
              }
            }
          }
        } catch (err) {
          // Token is invalid/expired
        }

        if (!isAdmin) {
          return sendError(res, 'Access denied. Public registration is restricted to the Staff role.', 403);
        }
      }

      const newUser = await AuthService.registerUser({ username, email, password, role: targetRole });
      
      return sendSuccess(res, 'User registered successfully', newUser, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log in an existing user
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const authData = await AuthService.loginUser({ email, password });
      
      return sendSuccess(res, 'Login successful', authData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get the current authenticated user's profile details
   */
  static async getProfile(req, res, next) {
    try {
      // req.user is set by authenticateUser middleware
      const userId = req.user.id;
      const profile = await AuthService.getUserProfile(userId);
      
      return sendSuccess(res, 'Profile retrieved successfully', profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset token
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AuthService.requestPasswordReset(email);
      return sendSuccess(res, result.message, { devResetUrl: result.devResetUrl });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify password reset token
   */
  static async verifyResetToken(req, res, next) {
    try {
      const { token } = req.query;
      const result = await AuthService.verifyResetToken(token);
      return sendSuccess(res, result.message, { email: result.email });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password to new one
   */
  static async resetPassword(req, res, next) {
    try {
      const { token, password, confirmPassword } = req.body;
      const result = await AuthService.resetPassword({ token, password, confirmPassword });
      return sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
