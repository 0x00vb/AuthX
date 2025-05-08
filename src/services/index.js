/**
 * Authentication services index file
 * Initializes all authentication services
 */

const authService = require('./auth');
const userService = require('./user');
const emailService = require('./email');
const twoFactorAuthService = require('./twoFactorAuth');

/**
 * Initialize authentication services
 * @param {Object} config - Configuration object
 * @returns {Object} - Configured authentication services
 */
module.exports = (config) => {
  const adapter = config.adapter;
  
  if (!adapter) {
    throw new Error('Database adapter is required');
  }
  
  const services = {
    auth: authService(config, adapter),
    user: userService(config, adapter),
    email: emailService(config),
    twoFactorAuth: twoFactorAuthService(config, adapter)
  };
  
  return services;
};