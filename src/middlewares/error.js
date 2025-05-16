/**
 * Error Handling Middleware
 */

const errorMiddleware = {
  /**
   * Not found error handler
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  notFound: (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
  },

  /**
   * Global error handler
   * @param {Object} error - Error object
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next
   */
  errorHandler: (error, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Only show error stack in development
    const stack = process.env.NODE_ENV === 'production' ? '🥞' : error.stack;
    
    res.status(statusCode).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? '🥞' : stack,
    });
  },
};

module.exports = errorMiddleware; 