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
  // Default rate limiting options
  const defaultOptions = {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts
      skipSuccessfulRequests: true
    },
    register: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 attempts
      skipSuccessfulRequests: true
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 attempts
      skipSuccessfulRequests: true
    }
  };

  // Initialize rate limit options safely
  const rateLimitOptions = config.rateLimitOptions || {};
  
  /**
   * Create a rate limiter
   * @param {Object} options - Rate limiting options
   * @returns {Function} - Express middleware function
   */
  const createRateLimiter = (options = {}) => {
    return expressRateLimit({
      windowMs: options.windowMs || 15 * 60 * 1000, // Default: 15 minutes
      max: options.max || 5, // Default: 5 attempts
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
  
  // Safely define the rate limiters with defaults if config options missing
  const loginOptions = rateLimitOptions.login || 
    { windowMs: rateLimitOptions.loginWindow, max: rateLimitOptions.loginMax } || 
    defaultOptions.login;
  
  const registerOptions = rateLimitOptions.register || 
    { windowMs: rateLimitOptions.registrationWindow, max: rateLimitOptions.registrationMax } || 
    defaultOptions.register;
  
  const passwordResetOptions = rateLimitOptions.passwordReset || 
    { windowMs: rateLimitOptions.passwordResetWindow, max: rateLimitOptions.passwordResetMax } || 
    defaultOptions.passwordReset;
  
  // Login rate limiter
  const login = createRateLimiter(loginOptions);
  
  // Registration rate limiter
  const register = createRateLimiter(registerOptions);
  
  // Password reset rate limiter
  const passwordReset = createRateLimiter(passwordResetOptions);
  
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