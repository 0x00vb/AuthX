/**
 * Authentication Middleware
 */
const jwt = require('jsonwebtoken');

const authMiddleware = {
  /**
   * Verify JWT token
   * @param {Object} config - AuthX configuration
   * @returns {Function} Express middleware
   */
  verifyToken: (config) => {
    return async (req, res, next) => {
      try {
        let token;

        // Get token from Authorization header or cookies
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
          token = req.headers.authorization.split(' ')[1];
        } else if (config.auth.useCookies && req.cookies && req.cookies._authx_token) {
          token = req.cookies._authx_token;
        }

        if (!token) {
          return res.status(401).json({ message: 'No token provided' });
        }

        try {
          const decoded = jwt.verify(token, config.jwt.accessTokenSecret);
          req.user = decoded;
          next();
        } catch (error) {
          return res.status(401).json({ message: 'Invalid or expired token' });
        }
      } catch (error) {
        next(error);
      }
    };
  },

  /**
   * Check if user has required role
   * @param {Array|String} roles - Required roles
   * @returns {Function} Express middleware
   */
  hasRole: (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userRoles = req.user.roles || [];
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      next();
    };
  },

  /**
   * Check if user has verified email
   * @param {Object} dbAdapter - Database adapter
   * @returns {Function} Express middleware
   */
  verifiedEmail: (dbAdapter) => {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: 'Authentication required' });
        }

        const User = dbAdapter.getModel('User');
        const user = await User.findById(req.user.userId);

        if (!user || !user.isEmailVerified) {
          return res.status(403).json({ message: 'Email not verified' });
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  },

  /**
   * Check if user has 2FA enabled
   * @param {Object} dbAdapter - Database adapter
   * @returns {Function} Express middleware
   */
  require2FA: (dbAdapter) => {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: 'Authentication required' });
        }

        const User = dbAdapter.getModel('User');
        const user = await User.findById(req.user.userId);

        if (!user || !user.twoFactorEnabled) {
          return res.status(403).json({ message: '2FA not enabled' });
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  },
};

module.exports = authMiddleware; 