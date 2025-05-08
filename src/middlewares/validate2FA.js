/**
 * Two-factor authentication validation middleware
 * Validates TOTP tokens for 2FA-enabled users
 */

const { InvalidCredentialsError } = require('../utils/errors');

/**
 * Create 2FA validation middleware
 * @param {Object} config - Configuration object
 * @param {Object} services - Authentication services
 * @returns {Function} - Express middleware function
 */
module.exports = (config, services) => {
  /**
   * 2FA validation middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  return async (req, res, next) => {
    try {
      // Skip if 2FA is not enabled globally
      if (!config.enable2FA) {
        return next();
      }
      
      // Skip if user is not authenticated
      if (!req.user) {
        return next();
      }
      
      // Check if user has 2FA enabled
      const userId = req.user.id;
      const isEnabled = await services.twoFactorAuth.isEnabled(userId);
      
      // Skip if user doesn't have 2FA enabled
      if (!isEnabled) {
        return next();
      }
      
      // Get 2FA token from headers, query, or body
      const token = 
        req.headers['x-2fa-token'] ||
        req.query.twoFactorToken ||
        (req.body && req.body.twoFactorToken);
      
      // If no token provided, require 2FA
      if (!token) {
        // Set 2FA required flag and return 401
        return res.status(401).json({
          error: {
            name: 'TwoFactorAuthRequired',
            message: 'Two-factor authentication code required',
            require2FA: true
          }
        });
      }
      
      // Verify 2FA token
      const isValid = await services.twoFactorAuth.verify(userId, token);
      
      if (!isValid) {
        throw new InvalidCredentialsError('Invalid two-factor authentication code');
      }
      
      // Valid 2FA token, continue
      next();
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        return res.status(401).json({
          error: {
            name: error.name,
            message: error.message,
            require2FA: true
          }
        });
      }
      
      next(error);
    }
  };
}; 