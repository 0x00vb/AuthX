/**
 * Authentication routes
 * Routes for login, register, refresh token, etc.
 */

const express = require('express');
const { 
  registerValidationRules, 
  loginValidationRules,
  validate 
} = require('../utils/validators');

/**
 * Initialize authentication routes
 * @param {Object} config - Configuration object
 * @param {Object} services - Authentication services
 * @param {Object} middlewares - Authentication middlewares
 * @returns {Object} - Express router
 */
module.exports = (config, services, middlewares) => {
  const router = express.Router();
  
  /**
   * @route POST /auth/register
   * @description Register a new user
   * @access Public
   */
  router.post(
    '/register',
    middlewares.rateLimit.register,
    registerValidationRules(),
    validate,
    async (req, res, next) => {
      try {
        const { email, password, name } = req.body;
        
        // Register user
        const { user, tokens } = await services.auth.register({
          email,
          password,
          name
        });
        
        // Send verification email if required
        if (config.requireEmailVerification && !user.isVerified) {
          const token = await services.user.requestEmailVerification(user.email);
          
          if (token) {
            await services.email.sendVerification(user, token);
          }
        } else {
          // Send welcome email
          await services.email.sendWelcome(user);
        }
        
        // Set refresh token in cookie if using session cookies
        if (config.useSessionCookies && tokens.refreshToken) {
          res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: config.cookieOptions?.secure || false,
            sameSite: config.cookieOptions?.sameSite || 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });
        }
        
        // Return response
        res.status(201).json({
          message: 'User registered successfully',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            isVerified: user.isVerified
          },
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: config.useSessionCookies ? undefined : tokens.refreshToken,
            expiresIn: tokens.expiresIn
          }
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  /**
   * @route POST /auth/login
   * @description Login a user
   * @access Public
   */
  router.post(
    '/login',
    middlewares.rateLimit.login,
    loginValidationRules(),
    validate,
    async (req, res, next) => {
      try {
        const { email, password } = req.body;
        
        // Login user
        const { user, tokens } = await services.auth.login(email, password);
        
        // Set tokens in cookies if using session cookies
        if (config.useSessionCookies) {
          // Set refresh token cookie
          if (tokens.refreshToken) {
            res.cookie('refreshToken', tokens.refreshToken, {
              httpOnly: true,
              secure: config.cookieOptions?.secure || false,
              sameSite: config.cookieOptions?.sameSite || 'lax',
              maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
          }
          
          // Also set access token cookie (needed for authentication)
          res.cookie('accessToken', tokens.accessToken, {
            httpOnly: true,
            secure: config.cookieOptions?.secure || false,
            sameSite: config.cookieOptions?.sameSite || 'lax',
            maxAge: 15 * 60 * 1000 // 15 minutes (matching default token expiry)
          });
        }
        
        // Check if user has 2FA enabled
        let requires2FA = false;
        if (config.enable2FA) {
          requires2FA = await services.twoFactorAuth.isEnabled(user.id);
        }
        
        // Return response
        res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: user.isVerified
          },
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: config.useSessionCookies ? undefined : tokens.refreshToken,
            expiresIn: tokens.expiresIn
          },
          requires2FA
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  /**
   * @route POST /auth/logout
   * @description Logout a user
   * @access Public
   */
  router.post('/logout', async (req, res, next) => {
    try {
      // Get refresh token
      const refreshToken = 
        req.body.refreshToken || 
        (req.cookies && req.cookies.refreshToken);
      
      // Logout user
      await services.auth.logout(refreshToken);
      
      // Clear refresh token cookie if using session cookies
      if (config.useSessionCookies) {
        res.clearCookie('refreshToken');
      }
      
      // Blacklist token if enabled
      if (config.tokenBlacklisting) {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
          await services.auth.blacklistToken(token);
        }
      }
      
      res.json({ message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * @route POST /auth/refresh-token
   * @description Refresh access token
   * @access Public
   */
  router.post('/refresh-token', async (req, res, next) => {
    try {
      // Get refresh token
      const refreshToken = 
        req.body.refreshToken || 
        (req.cookies && req.cookies.refreshToken);
      
      if (!refreshToken) {
        return res.status(400).json({ 
          error: { 
            message: 'Refresh token is required' 
          } 
        });
      }
      
      // Refresh token
      const tokens = await services.auth.refreshToken(refreshToken);
      
      // Set refresh token in cookie if using session cookies
      if (config.useSessionCookies && tokens.refreshToken) {
        res.cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: config.cookieOptions?.secure || false,
          sameSite: config.cookieOptions?.sameSite || 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }
      
      // Return response
      res.json({
        message: 'Token refreshed successfully',
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: config.useSessionCookies ? undefined : tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * @route GET /auth/verify-email
   * @description Verify email address
   * @access Public
   */
  router.get('/verify-email', async (req, res, next) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({ 
          error: { 
            message: 'Verification token is required' 
          } 
        });
      }
      
      // Verify email
      await services.user.verifyEmail(token);
      
      res.json({ 
        message: 'Email verified successfully' 
      });
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * @route POST /auth/resend-verification
   * @description Resend verification email
   * @access Public
   */
  router.post('/resend-verification', async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          error: { 
            message: 'Email is required' 
          } 
        });
      }
      
      // Get user to verify email exists
      const user = await services.user.getUserByEmail(email);
      
      // Request email verification
      const token = await services.user.requestEmailVerification(email);
      
      // Send verification email if token was generated
      if (token) {
        await services.email.sendVerification(user, token);
      }
      
      res.json({ 
        message: 'Verification email sent successfully' 
      });
    } catch (error) {
      // Don't reveal if email exists
      if (error.name === 'UserNotFoundError') {
        return res.json({ 
          message: 'Verification email sent successfully' 
        });
      }
      
      next(error);
    }
  });
  
  /**
   * @route POST /auth/forgot-password
   * @description Request password reset
   * @access Public
   */
  router.post('/forgot-password', middlewares.rateLimit.passwordReset, async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          error: { 
            message: 'Email is required' 
          } 
        });
      }
      
      try {
        // Get user to verify email exists
        const user = await services.user.getUserByEmail(email);
        
        // Request password reset
        const token = await services.user.requestPasswordReset(email);
        
        // Send password reset email
        await services.email.sendPasswordReset(user, token);
      } catch (error) {
        // Don't reveal if email exists
        if (error.name === 'UserNotFoundError') {
          // Do nothing
        } else {
          throw error;
        }
      }
      
      res.json({ 
        message: 'Password reset email sent successfully' 
      });
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * @route POST /auth/reset-password
   * @description Reset password with token
   * @access Public
   */
  router.post('/reset-password', async (req, res, next) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ 
          error: { 
            message: 'Token and password are required' 
          } 
        });
      }
      
      // Reset password
      await services.user.resetPassword(token, password);
      
      res.json({ 
        message: 'Password reset successfully' 
      });
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * @route GET /auth/me
   * @description Get the authenticated user
   * @access Private
   */
  router.get(
    '/me',
    middlewares.requireAuth,
    middlewares.validate2FA,
    async (req, res, next) => {
      try {
        // Get complete user data from the service
        const user = await services.user.getUserById(req.user.id);
        
        res.json({
          user
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  return router;
}; 