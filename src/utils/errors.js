/**
 * Custom error classes for Express Auth Toolkit
 */

/**
 * Base authentication error class
 */
class AuthError extends Error {
  /**
   * Create a new authentication error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode || 500;
    this.isAuthError = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Invalid credentials error
 */
class InvalidCredentialsError extends AuthError {
  /**
   * Create a new invalid credentials error
   * @param {string} message - Error message
   */
  constructor(message = 'Invalid email or password') {
    super(message, 401);
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * User not found error
 */
class UserNotFoundError extends AuthError {
  /**
   * Create a new user not found error
   * @param {string} message - Error message
   */
  constructor(message = 'User not found') {
    super(message, 404);
    this.name = 'UserNotFoundError';
  }
}

/**
 * Email already in use error
 */
class EmailInUseError extends AuthError {
  /**
   * Create a new email in use error
   * @param {string} message - Error message
   */
  constructor(message = 'Email is already in use') {
    super(message, 409);
    this.name = 'EmailInUseError';
  }
}

/**
 * Invalid token error
 */
class InvalidTokenError extends AuthError {
  /**
   * Create a new invalid token error
   * @param {string} message - Error message
   */
  constructor(message = 'Invalid or expired token') {
    super(message, 401);
    this.name = 'InvalidTokenError';
  }
}

/**
 * Access denied error
 */
class AccessDeniedError extends AuthError {
  /**
   * Create a new access denied error
   * @param {string} message - Error message
   */
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AccessDeniedError';
  }
}

/**
 * Validation error
 */
class ValidationError extends AuthError {
  /**
   * Create a new validation error
   * @param {string|Object} errors - Error message or errors object
   */
  constructor(errors) {
    const message = typeof errors === 'string' ? errors : 'Validation failed';
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = typeof errors === 'string' ? [errors] : errors;
  }
}

/**
 * Configuration error
 */
class ConfigurationError extends AuthError {
  /**
   * Create a new configuration error
   * @param {string} message - Error message
   */
  constructor(message = 'Invalid configuration') {
    super(message, 500);
    this.name = 'ConfigurationError';
  }
}

/**
 * Not verified error
 */
class NotVerifiedError extends AuthError {
  /**
   * Create a new not verified error
   * @param {string} message - Error message
   */
  constructor(message = 'Email not verified') {
    super(message, 403);
    this.name = 'NotVerifiedError';
  }
}

/**
 * Rate limit error
 */
class RateLimitError extends AuthError {
  /**
   * Create a new rate limit error
   * @param {string} message - Error message
   */
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Central error handler for Express
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Handle auth errors
  if (err.isAuthError) {
    return res.status(err.statusCode).json({
      error: {
        name: err.name,
        message: err.message,
        errors: err.errors
      }
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        name: 'InvalidTokenError',
        message: 'Invalid or expired token'
      }
    });
  }
  
  // Handle unknown errors
  console.error(err);
  res.status(500).json({
    error: {
      name: 'ServerError',
      message: 'An unexpected error occurred'
    }
  });
};

module.exports = {
  AuthError,
  InvalidCredentialsError,
  UserNotFoundError,
  EmailInUseError,
  InvalidTokenError,
  AccessDeniedError,
  ValidationError,
  ConfigurationError,
  NotVerifiedError,
  RateLimitError,
  errorHandler
}; 