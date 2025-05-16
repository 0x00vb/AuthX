/**
 * Rate Limiting Middleware
 */
const rateLimit = require('express-rate-limit');

const rateLimitMiddleware = {
  /**
   * Create rate limiter
   * @param {Object} options - Rate limiter options
   * @returns {Function} Express middleware
   */
  createLimiter: (options = {}) => {
    return rateLimit({
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
      max: options.max || 100, // 100 requests per windowMs by default
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      message: options.message || 'Too many requests, please try again later.',
      handler: (req, res, next, options) => {
        res.status(options.statusCode).json({
          message: options.message,
        });
      },
      skip: (req) => {
        // Skip rate limiting for specific users or conditions if needed
        if (options.skipCondition && options.skipCondition(req)) {
          return true;
        }
        return false;
      },
    });
  },

  /**
   * Authentication rate limiter (for login, registration, etc.)
   * @param {Object} config - AuthX configuration
   * @returns {Function} Express middleware
   */
  auth: (config) => {
    return rateLimit({
      windowMs: config.security.rateLimit.windowMs,
      max: config.security.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many authentication attempts, please try again later.',
      handler: (req, res) => {
        res.status(429).json({
          message: 'Too many authentication attempts, please try again later.',
        });
      },
    });
  },

  /**
   * Password reset rate limiter
   * @returns {Function} Express middleware
   */
  passwordReset: () => {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 requests per hour
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many password reset attempts, please try again later.',
      handler: (req, res) => {
        res.status(429).json({
          message: 'Too many password reset attempts, please try again later.',
        });
      },
    });
  },

  /**
   * Email verification rate limiter
   * @returns {Function} Express middleware
   */
  emailVerification: () => {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // 5 requests per hour
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many email verification attempts, please try again later.',
      handler: (req, res) => {
        res.status(429).json({
          message: 'Too many email verification attempts, please try again later.',
        });
      },
    });
  },
};

module.exports = rateLimitMiddleware; 