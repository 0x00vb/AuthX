/**
 * Role-based access control middleware
 * Checks if the authenticated user has the required role
 */

const { AccessDeniedError } = require('../utils/errors');

/**
 * Create role-based access control middleware
 * @param {Object} config - Configuration object
 * @param {Object} services - Authentication services
 * @returns {Function} - Middleware factory function
 */
module.exports = (config, services) => {
  /**
   * Role-based access control middleware factory
   * @param {...string} roles - Allowed roles
   * @returns {Function} - Express middleware function
   */
  return (...roles) => {
    /**
     * Express middleware function
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next function
     */
    return async (req, res, next) => {
      try {
        // Check if user is authenticated
        if (!req.user) {
          throw new AccessDeniedError('Authentication required');
        }
        
        // If no roles specified, allow access
        if (!roles.length) {
          return next();
        }
        
        // Check if user has one of the required roles
        const userRole = req.user.role || 'user';
        
        // Always allow admin role (unless specifically excluded)
        if (userRole === 'admin' && !roles.includes('!admin')) {
          return next();
        }
        
        // Check for roles prefixed with ! (not allowed)
        const notAllowedRoles = roles.filter(r => r.startsWith('!')).map(r => r.substring(1));
        if (notAllowedRoles.includes(userRole)) {
          throw new AccessDeniedError(`Role '${userRole}' is not allowed`);
        }
        
        // Check for allowed roles
        const allowedRoles = roles.filter(r => !r.startsWith('!'));
        if (allowedRoles.length && !allowedRoles.includes(userRole)) {
          throw new AccessDeniedError(`Role '${userRole}' is not authorized`);
        }
        
        next();
      } catch (error) {
        if (error instanceof AccessDeniedError) {
          return res.status(403).json({
            error: {
              name: error.name,
              message: error.message || 'Access denied'
            }
          });
        }
        
        next(error);
      }
    };
  };
}; 