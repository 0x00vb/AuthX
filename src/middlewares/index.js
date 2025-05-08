/**
 * Authentication middlewares index file
 * Initializes all authentication middlewares
 */

const requireAuth = require('./requireAuth');
const requireRole = require('./requireRole');
const rateLimit = require('./rateLimit');
const validate2FA = require('./validate2FA');
const passport = require('./passport');

/**
 * Initialize authentication middlewares
 * @param {Object} config - Configuration object
 * @param {Object} services - Authentication services
 * @returns {Object} - Configured authentication middlewares
 */
module.exports = (config, services) => {
  // Initialize passport strategies
  passport.init(config);
  
  return {
    // Authentication middleware
    requireAuth: requireAuth(config, services),
    
    // Role-based access control middleware
    requireRole: requireRole(config, services),
    
    // Rate limiting middleware
    rateLimit: rateLimit(config),
    
    // Two-factor authentication middleware
    validate2FA: validate2FA(config, services),
    
    // Passport strategies
    passport
  };
}; 