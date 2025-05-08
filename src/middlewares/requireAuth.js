/**
 * Authentication middleware
 * Ensures a valid JWT token is present in the request
 */

const { InvalidTokenError } = require('../utils/errors');

/**
 * Create authentication middleware
 * @param {Object} config - Configuration object
 * @param {Object} services - Authentication services
 * @returns {Function} - Express middleware function
 */
module.exports = (config, services) => {
  /**
   * Authentication middleware
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  return async (req, res, next) => {
    try {
      // Get authenticated user from request
      const user = await services.auth.getAuthenticatedUser(req);
      
      // Set user on request
      req.user = user;
      
      next();
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        return res.status(401).json({
          error: {
            name: error.name,
            message: error.message || 'Authentication required'
          }
        });
      }
      
      next(error);
    }
  };
}; 