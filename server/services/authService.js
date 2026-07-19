import User from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/passwordHelper.js';
import { generateToken } from '../utils/jwtHelper.js';

class AuthService {
  /**
   * Register a new user
   * @param {object} param0 - { username, email, password, role }
   * @returns {Promise<object>} The registered user details
   */
  static async registerUser({ username, email, password, role }) {
    // 1. Check if email is already taken
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      const error = new Error('Email is already registered');
      error.statusCode = 400;
      throw error;
    }

    // 2. Check if username is already taken
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      const error = new Error('Username is already taken');
      error.statusCode = 400;
      throw error;
    }

    // 3. Hash the password
    const passwordHash = await hashPassword(password);

    // 4. Save the user
    const userId = await User.create({
      username,
      email,
      passwordHash,
      role
    });

    return {
      id: userId,
      username,
      email,
      role: role || 'Staff'
    };
  }

  /**
   * Authenticate a user login request
   * @param {object} param0 - { email, password }
   * @returns {Promise<object>} Auth token and authenticated user profile
   */
  static async loginUser({ email, password }) {
    // 1. Fetch user by email
    const user = await User.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Check account status
    if (user.status === 'Inactive') {
      const error = new Error('Your account has been deactivated. Please contact your system administrator.');
      error.statusCode = 403;
      throw error;
    }

    // 2. Validate password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // 3. Generate JWT access token
    const token = generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        warehouse_id: user.warehouse_id
      }
    };
  }

  /**
   * Fetch a user's details by their ID
   * @param {number} userId 
   * @returns {Promise<object>} User profile details
   */
  static async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User profile not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  /**
   * Request a password reset token
   */
  static async requestPasswordReset(email) {
    const user = await User.findByEmail(email);
    if (!user) {
      const error = new Error('No account found with this email address.');
      error.statusCode = 404;
      throw error;
    }

    // Generate secure random token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiry: 15 minutes in the future
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save in database
    await User.updateResetToken(email, token, expiresAt);

    const devResetUrl = `http://localhost:5173/reset-password?token=${token}`;
    console.log('\n========================================');
    console.log('DEVELOPMENT PASSWORD RESET REQUEST');
    console.log(`Email: ${email}`);
    console.log(`Reset URL: ${devResetUrl}`);
    console.log('========================================\n');

    return {
      message: 'Password reset link has been generated.',
      devResetUrl
    };
  }

  /**
   * Verify if a reset token is valid
   */
  static async verifyResetToken(token) {
    if (!token) {
      const error = new Error('Reset token is required.');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findByResetToken(token);
    if (!user) {
      const error = new Error('Invalid or unrecognized reset token.');
      error.statusCode = 400;
      throw error;
    }

    const expiryTime = new Date(user.reset_token_expires_at).getTime();
    if (expiryTime < Date.now()) {
      const error = new Error('Reset token has expired. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    return {
      message: 'Token is valid.',
      userId: user.id,
      email: user.email
    };
  }

  /**
   * Complete password reset
   */
  static async resetPassword({ token, password, confirmPassword }) {
    if (password !== confirmPassword) {
      const error = new Error('Passwords do not match.');
      error.statusCode = 400;
      throw error;
    }

    // Verify token validity
    const tokenInfo = await this.verifyResetToken(token);

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Save and invalidate token
    await User.updatePasswordAndInvalidateToken(tokenInfo.userId, passwordHash);

    return {
      message: 'Password has been successfully updated.'
    };
  }
}

export default AuthService;
