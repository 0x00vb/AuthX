import { Router } from 'express';
import { AuthController } from '../controllers';
import { AuthService } from '../services';
import { AuthXConfig } from '../config/types';
import { DbAdapter } from '../adapters/db';
import { AuthXMiddleware } from '../middleware';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  refreshTokenValidation,
} from '../utils/validation';

/**
 * Setup authentication routes
 * @param router Express router
 * @param config AuthX configuration
 * @param dbAdapter Database adapter
 */
export function setupAuthRoutes(router: Router, config: AuthXConfig, dbAdapter: DbAdapter): void {
  // Create services
  const authService = new AuthService(config, dbAdapter);
  
  // Create controllers
  const authController = new AuthController(authService);
  
  // Create middleware
  const authMiddleware = new AuthXMiddleware(config, dbAdapter);
  
  // Register routes
  router.post('/register', registerValidation, authController.register);
  router.post('/login', loginValidation, authController.login);
  router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
  router.post('/reset-password', resetPasswordValidation, authController.resetPassword);
  router.post('/refresh-token', refreshTokenValidation, authController.refreshToken);
  router.get('/me', authMiddleware.authenticate({ throwError: true }), authController.getMe);
} 