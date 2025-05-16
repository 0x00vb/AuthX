/**
 * Authentication Routes
 */
const express = require('express');

/**
 * Create authentication router
 * @param {Object} authX - AuthX instance
 * @param {Object} services - Services
 * @returns {Object} Express router
 */
const createAuthRouter = (authX, services) => {
  const router = express.Router();
  const { AuthService } = services;
  const { auth: authMiddleware, rateLimit } = authX.middlewares;

  // Apply rate limiting to authentication routes
  router.use(rateLimit.auth(authX));

  /**
   * @route POST /auth/register
   * @description Register a new user
   * @access Public
   */
  router.post('/register', async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route POST /auth/login
   * @description Login user
   * @access Public
   */
  router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const result = await AuthService.login(email, password);

      // Set cookie if cookie-based auth is enabled
      if (authX.auth.useCookies) {
        res.cookie('_authx_token', result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 1000 * 60 * 15, // 15 minutes
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route POST /auth/logout
   * @description Logout user
   * @access Private
   */
  router.post('/logout', authMiddleware.verifyToken(authX), async (req, res, next) => {
    try {
      const refreshToken = req.body.refreshToken;
      
      await AuthService.logout(refreshToken);

      // Clear cookie if cookie-based auth is enabled
      if (authX.auth.useCookies) {
        res.clearCookie('_authx_token');
      }

      res.json({ message: 'Logged out successfully' });
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
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      const result = await AuthService.refreshToken(refreshToken);

      // Update cookie if cookie-based auth is enabled
      if (authX.auth.useCookies) {
        res.cookie('_authx_token', result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 1000 * 60 * 15, // 15 minutes
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route GET /auth/verify-email
   * @description Verify email
   * @access Public
   */
  router.get('/verify-email', rateLimit.emailVerification(), async (req, res, next) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
      }

      const result = await AuthService.verifyEmail(token);

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route POST /auth/forgot-password
   * @description Request password reset
   * @access Public
   */
  router.post('/forgot-password', rateLimit.passwordReset(), async (req, res, next) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const result = await AuthService.requestPasswordReset(email);

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route POST /auth/reset-password
   * @description Reset password
   * @access Public
   */
  router.post('/reset-password', rateLimit.passwordReset(), async (req, res, next) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: 'Token and password are required' });
      }

      const result = await AuthService.resetPassword(token, password);

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
};

module.exports = createAuthRouter; 