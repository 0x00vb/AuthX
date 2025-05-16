/**
 * CLI Utility for AuthX
 */
const generateSecret = require('./generateSecret');
const hashPassword = require('./hashPassword');
const validateToken = require('./validateToken');

module.exports = {
  generateSecret,
  hashPassword,
  validateToken,
}; 