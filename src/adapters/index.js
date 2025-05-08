/**
 * Database adapters index file
 * Export adapter interfaces and implementations
 */

const memoryAdapter = require('./memory');
const mongoAdapter = require('./mongo');
const sqlAdapter = require('./sql');

module.exports = {
  memory: memoryAdapter,
  mongo: mongoAdapter,
  sql: sqlAdapter,
  
  // Export the adapter interface for custom implementations
  AdapterInterface: require('./interface')
}; 