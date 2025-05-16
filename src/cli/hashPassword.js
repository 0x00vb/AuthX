/**
 * Hash passwords using bcrypt
 */
const bcrypt = require('bcrypt');

/**
 * Hash a password using bcrypt
 * @param {string} password - Password to hash
 * @param {number} saltRounds - Number of salt rounds (default: 12)
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password, saltRounds = 12) {
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param {string} password - Password to verify
 * @param {string} hash - Hash to verify against
 * @returns {Promise<boolean>} True if password matches hash
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// CLI handler
async function cli() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node hashPassword.js <password> [saltRounds] [--verify <hash>]');
    process.exit(1);
  }

  const password = args[0];
  
  // Check if it's a verify operation
  const verifyIndex = args.indexOf('--verify');
  if (verifyIndex !== -1 && args.length > verifyIndex + 1) {
    const hash = args[verifyIndex + 1];
    const isValid = await verifyPassword(password, hash);
    console.log(`Password verification: ${isValid ? 'VALID' : 'INVALID'}`);
    return;
  }

  // Otherwise it's a hash operation
  let saltRounds = 12;
  if (args.length > 1 && !isNaN(parseInt(args[1]))) {
    saltRounds = parseInt(args[1]);
  }

  try {
    const hash = await hashPassword(password, saltRounds);
    console.log(`Password hash (${saltRounds} rounds): ${hash}`);
  } catch (error) {
    console.error(`Error hashing password: ${error.message}`);
  }
}

// Check if running as script
if (require.main === module) {
  cli().catch(console.error);
}

module.exports = {
  hashPassword,
  verifyPassword,
}; 