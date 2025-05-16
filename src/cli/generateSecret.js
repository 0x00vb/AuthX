/**
 * Generate secrets for JWT tokens
 */
const crypto = require('crypto');

/**
 * Generate a secure random secret
 * @param {number} length - Length of the secret in bytes (default: 64)
 * @returns {string} Hex-encoded secret
 */
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// CLI handler
function cli() {
  const args = process.argv.slice(2);
  let length = 64;

  // Parse arguments
  if (args.length > 0 && !isNaN(parseInt(args[0]))) {
    length = parseInt(args[0]);
  }

  // Generate and print secret
  const secret = generateSecret(length);
  console.log(`Generated ${length}-byte secret: ${secret}`);
}

// Check if running as script
if (require.main === module) {
  cli();
}

module.exports = generateSecret; 