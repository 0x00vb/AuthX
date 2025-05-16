/**
 * Validate and decode JWT tokens
 */
const jwt = require('jsonwebtoken');

/**
 * Validate and decode a JWT token
 * @param {string} token - JWT token to validate
 * @param {string} secret - Secret used to sign the token
 * @returns {Object} Decoded token payload or null if invalid
 */
function validateToken(token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

/**
 * Decode a JWT token without validation
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload or null if invalid format
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

// CLI handler
function cli() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node validateToken.js <token> [secret] [--decode]');
    process.exit(1);
  }

  const token = args[0];
  const decodeOnly = args.includes('--decode');

  if (decodeOnly) {
    const decoded = decodeToken(token);
    if (decoded) {
      console.log('Token decoded (without verification):');
      console.log(JSON.stringify(decoded, null, 2));
    } else {
      console.error('Invalid token format');
    }
    return;
  }

  if (args.length < 2) {
    console.error('Secret is required for validation');
    process.exit(1);
  }

  const secret = args[1];
  const validated = validateToken(token, secret);
  
  if (validated) {
    console.log('Token is valid. Payload:');
    console.log(JSON.stringify(validated, null, 2));
  } else {
    console.error('Invalid token or signature');
  }
}

// Check if running as script
if (require.main === module) {
  cli();
}

module.exports = {
  validateToken,
  decodeToken,
};