import User from '../models/User.js';
import { hashPassword } from '../utils/passwordHelper.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

class UserController {
  /**
   * Get all registered users (Admin only)
   */
  static async getAll(req, res, next) {
    try {
      const users = await User.findAll();
      // Remove password hash from response objects
      const sanitizedUsers = users.map(user => {
        const { password_hash, ...rest } = user;
        return rest;
      });
      return sendSuccess(res, 'Users retrieved successfully', sanitizedUsers);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new user (Admin only)
   */
  static async create(req, res, next) {
    try {
      const { username, email, password, role, status, warehouse_id } = req.body;

      // Check username duplicate
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return sendError(res, 'Username is already taken.', 400);
      }

      // Check email duplicate
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return sendError(res, 'Email is already registered.', 400);
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const insertedId = await User.create({
        username,
        email,
        passwordHash,
        role: role || 'Staff',
        status: status || 'Active',
        warehouseId: warehouse_id || null
      });

      return sendSuccess(res, 'User created successfully', {
        id: insertedId,
        username,
        email,
        role: role || 'Staff',
        status: status || 'Active',
        warehouse_id: warehouse_id || null
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user details (Admin only)
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { username, email, role, status, warehouse_id } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return sendError(res, 'User not found.', 404);
      }

      // Check if username is taken by another user
      const duplicateUser = await User.findByUsername(username);
      if (duplicateUser && duplicateUser.id !== parseInt(id, 10)) {
        return sendError(res, 'Username is already taken by another account.', 400);
      }

      // Check if email is taken by another user
      const duplicateEmail = await User.findByEmail(email);
      if (duplicateEmail && duplicateEmail.id !== parseInt(id, 10)) {
        return sendError(res, 'Email is already registered by another account.', 400);
      }

      await User.updateUser(id, {
        username,
        email,
        role,
        status,
        warehouse_id: warehouse_id || null
      });

      return sendSuccess(res, 'User updated successfully', {
        id,
        username,
        email,
        role,
        status,
        warehouse_id
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a user (Admin only)
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (parseInt(id, 10) === req.user.id) {
        return sendError(res, 'Access denied. You cannot delete your own account.', 400);
      }

      const user = await User.findById(id);
      if (!user) {
        return sendError(res, 'User not found.', 404);
      }

      await User.delete(id);
      return sendSuccess(res, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset staff password administratively (Admin only)
   */
  static async adminResetPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.trim().length < 6) {
        return sendError(res, 'Password must be at least 6 characters long.', 400);
      }

      const user = await User.findById(id);
      if (!user) {
        return sendError(res, 'User not found.', 404);
      }

      const passwordHash = await hashPassword(password);
      await User.updatePassword(id, passwordHash);

      return sendSuccess(res, 'User password reset successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
