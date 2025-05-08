/**
 * Authentication routes index file
 * Sets up all authentication routes
 */

const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./user');
const twoFactorAuthRoutes = require('./twoFactorAuth');
const oauthRoutes = require('./oauth');
const { errorHandler } = require('../utils/errors');

/**
 * Initialize authentication routes
 * @param {Object} config - Configuration object
 * @param {Object} services - Authentication services
 * @param {Object} middlewares - Authentication middlewares
 * @returns {Object} - Express router
 */
module.exports = (config, services, middlewares) => {
  const router = express.Router();
  
  // Body parsing middleware
  router.use(express.json());
  
  // Set up routes
  router.use('/auth', authRoutes(config, services, middlewares));
  router.use('/users', userRoutes(config, services, middlewares));
  router.use('/2fa', twoFactorAuthRoutes(config, services, middlewares));
  
  // OAuth routes if enabled
  if (config.oauth) {
    router.use('/oauth', oauthRoutes(config, services, middlewares));
  }
  
  // Error handling middleware
  router.use(errorHandler);
  
  return router;
}; 