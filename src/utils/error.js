/**
 * Error Utilities
 */

// Custom error classes
class AuthXError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthXError';
  }
}

class ValidationError extends AuthXError {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class AuthenticationError extends AuthXError {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

class AuthorizationError extends AuthXError {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

class NotFoundError extends AuthXError {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

// Error utility methods
const errorUtils = {
  // Error classes
  AuthXError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,

  /**
   * Create an error with HTTP status code
   * @param {String} message - Error message
   * @param {Number} statusCode - HTTP status code
   * @returns {Error} Error with status code
   */
  createError: (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  },

  /**
   * Handle async errors for Express routes
   * @param {Function} fn - Async function
   * @returns {Function} Express middleware
   */
  asyncHandler: (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },

  /**
   * Format error for API response
   * @param {Error} error - Error object
   * @returns {Object} Formatted error
   */
  formatError: (error) => {
    const formattedError = {
      message: error.message || 'An unexpected error occurred',
      status: error.statusCode || 500,
    };

    // Add validation errors if available
    if (error.name === 'ValidationError' && error.errors) {
      formattedError.errors = error.errors;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV !== 'production') {
      formattedError.stack = error.stack;
    }

    return formattedError;
  },
};

module.exports = errorUtils; 