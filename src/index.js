/**
 * Express Auth Toolkit
 * A comprehensive authentication toolkit for Express.js applications
 */

const authRoutes = require('./routes');
const authMiddlewares = require('./middlewares');
const authServices = require('./services');
const configLoader = require('./config/loader');

/**
 * The main authentication toolkit class
 */
class AuthX {
  /**
   * Create a new AuthX instance
   * @param {Object} options - Configuration options
   * @param {Object} [options.jwtOptions] - JWT configuration options
   * @param {string} [options.jwtOptions.secret] - JWT secret key
   * @param {string} [options.jwtOptions.accessExpiresIn] - Access token expiration time
   * @param {string} [options.jwtOptions.refreshExpiresIn] - Refresh token expiration time
   * @param {Object} [options.emailOptions] - Email configuration options
   * @param {string} [options.emailOptions.from] - Default from email address
   * @param {Object} [options.emailOptions.transport] - Nodemailer transport configuration
   * @param {Object} [options.rateLimitOptions] - Rate limiting configuration
   * @param {Function} [options.adapter] - Custom database adapter
   * @param {boolean} [options.useRefreshTokens=true] - Whether to use refresh tokens
   * @param {boolean} [options.useSessionCookies=false] - Whether to use session cookies
   * @param {boolean} [options.enable2FA=false] - Whether to enable 2FA
   * @param {string} [options.baseUrl='/auth'] - Base URL for auth routes
   */
  constructor(options = {}) {
    this.config = configLoader(options);
    this.services = authServices(this.config);
    this.middlewares = authMiddlewares(this.config, this.services);
    this.routes = authRoutes(this.config, this.services, this.middlewares);
  }

  /**
   * Initialize and register the authentication toolkit with an Express app
   * @param {Object} app - Express app instance
   * @returns {Object} - The Express app instance
   */
  init(app) {
    if (!app || typeof app.use !== 'function') {
      throw new Error('Invalid Express app instance');
    }

    // Register routes
    app.use(this.config.baseUrl, this.routes);

    return app;
  }

  /**
   * Get authentication middleware functions
   * @returns {Object} - Authentication middleware functions
   */
  getMiddlewares() {
    return this.middlewares;
  }

  /**
   * Get authentication service functions
   * @returns {Object} - Authentication service functions
   */
  getServices() {
    return this.services;
  }
}

module.exports = AuthX;

// Export individual components for advanced usage
module.exports.middlewares = require('./middlewares');
module.exports.services = require('./services');
module.exports.routes = require('./routes');
module.exports.utils = require('./utils');
module.exports.adapters = require('./adapters'); 