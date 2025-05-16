/**
 * Routes Index
 */

const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./user');
const twoFactorRoutes = require('./twoFactor');

/**
 * Create router with all AuthX routes
 * @param {Object} authX - AuthX instance
 * @param {Object} services - Services
 * @returns {Object} Express router
 */
const createRouter = (authX, services) => {
  const router = express.Router();

  // Apply routes
  router.use('/auth', authRoutes(authX, services));
  router.use('/users', userRoutes(authX, services));
  router.use('/2fa', twoFactorRoutes(authX, services));

  return router;
};

module.exports = createRouter; 