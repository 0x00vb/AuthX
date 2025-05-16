/**
 * AuthX - A comprehensive authentication system for Express.js applications
 */

const AuthX = require('./config/authx');
const middlewares = require('./middlewares');
const services = require('./services');
const utils = require('./utils');
const cli = require('./cli');
const createRouter = require('./routes');
const roles = require('./utils/roles');
const { setup } = require('./config/simplifiedAPI');

// Create a simple function for quick setup
const quickSetup = setup;

module.exports = {
  // Core components
  AuthX,
  middlewares,
  services,
  utils,
  cli,
  createRouter,
  roles,
  
  // Simplified API
  setup,
  quickSetup
}; 