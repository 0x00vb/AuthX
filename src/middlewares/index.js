/**
 * Middlewares Index
 */

const authMiddleware = require('./auth');
const errorMiddleware = require('./error');
const rateLimitMiddleware = require('./rateLimit');

module.exports = {
  auth: authMiddleware,
  error: errorMiddleware,
  rateLimit: rateLimitMiddleware,
}; 