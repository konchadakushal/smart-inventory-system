import { Router } from 'express';
import AuthController from '../controllers/authController.js';
import { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator } from '../validators/authValidator.js';
import { checkValidation } from '../middleware/validationMiddleware.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();

// Route: POST /api/auth/register
// Allows new user signup (Validation applied)
router.post('/register', registerValidator, checkValidation, AuthController.register);

// Route: POST /api/auth/login
// Validates credentials and returns JWT
router.post('/login', loginValidator, checkValidation, AuthController.login);

// Route: GET /api/auth/profile
// Protected route returning authenticated user identity
router.get('/profile', authenticateUser, AuthController.getProfile);

// Route: POST /api/auth/forgot-password
// Generates random secure reset token
router.post('/forgot-password', forgotPasswordValidator, checkValidation, AuthController.forgotPassword);

// Route: GET /api/auth/verify-reset-token
// Validates whether reset token is still active
router.get('/verify-reset-token', AuthController.verifyResetToken);

// Route: POST /api/auth/reset-password
// Applies new password using reset token
router.post('/reset-password', resetPasswordValidator, checkValidation, AuthController.resetPassword);

export default router;
