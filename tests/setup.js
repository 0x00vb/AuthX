/**
 * AuthX Test Setup Helper
 * 
 * This file provides utilities to help with test setup and debugging
 */

const { EmailHelper, TokenHelper } = require('./helpers');
const app = require('../test-server');

// Global debug mode for tests
const DEBUG = process.env.DEBUG === 'true';

// Create reusable helper instances
const emailHelper = new EmailHelper(app);
const tokenHelper = new TokenHelper('test-secret-key');

// Add a global debug log function
const debugLog = (...args) => {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
};

// Export helpers and utils
module.exports = {
  app,
  emailHelper,
  tokenHelper,
  debugLog,
  
  // Check expected status vs actual status
  expectStatus: (expected, received, message = '') => {
    if (expected !== received) {
      console.warn(`[STATUS MISMATCH] Expected: ${expected}, Received: ${received} ${message ? '- ' + message : ''}`);
    }
    return received;
  }
}; 