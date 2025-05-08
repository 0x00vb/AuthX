/**
 * Rate limiting middleware
 * Prevents brute force attacks by limiting request frequency
 */
const expressRateLimit = require('express-rate-limit');
const { RateLimitError } = require('../utils/errors');

/**
 * Create rate limiting middleware
 * @param {Object} config - Configuration object
 * @returns {Object} - Rate limiting middleware factory functions
 */
module.exports = (config) => {
  /**
   * Create a rate limiter
   * @param {Object} options - Rate limiting options
   * @returns {Function} - Express middleware function
   */
  const createRateLimiter = (options) => {
    return expressRateLimit({
      windowMs: options.windowMs,
      max: options.max,
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skip: options.skip || (() => false),
      handler: (req, res, next, options) => {
        // Return JSON error
        res.status(429).json({
          error: {
            name: 'RateLimitError',
            message: options.message || 'Too many requests, please try again later'
          }
        });
      },
      ...options
    });
  };
  
  // Login rate limiter
  const login = createRateLimiter(config.rateLimitOptions.login);
  
  // Registration rate limiter
  const register = createRateLimiter(config.rateLimitOptions.register);
  
  // Password reset rate limiter
  const passwordReset = createRateLimiter(config.rateLimitOptions.passwordReset);
  
  /**
   * Generic rate limiter factory
   * @param {Object} options - Rate limiting options
   * @returns {Function} - Express middleware function
   */
  const generic = (options) => createRateLimiter(options);
  
  return {
    login,
    register,
    passwordReset,
    generic
  };
}; 