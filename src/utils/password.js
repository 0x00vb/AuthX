/**
 * Password hashing and validation utilities
 */
const bcrypt = require('bcrypt');

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @param {number} [saltRounds=10] - Number of salt rounds for bcrypt
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password, saltRounds = 10) => {
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - Whether the password is valid
 */
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Check password strength against password policy
 * @param {string} password - Plain text password
 * @param {Object} passwordPolicy - Password policy configuration
 * @returns {Object} - Validation result with isValid and errors
 */
const validatePasswordStrength = (password, passwordPolicy) => {
  const result = {
    isValid: true,
    errors: []
  };

  // Check minimum length
  if (passwordPolicy.minLength && password.length < passwordPolicy.minLength) {
    result.isValid = false;
    result.errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`);
  }

  // Check for lowercase letters
  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must include at least one lowercase letter');
  }

  // Check for uppercase letters
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must include at least one uppercase letter');
  }

  // Check for numbers
  if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must include at least one number');
  }

  // Check for special characters
  if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must include at least one special character');
  }

  return result;
};

/**
 * Generate a secure random password
 * @param {number} [length=12] - Password length
 * @returns {string} - Generated password
 */
const generateRandomPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};

module.exports = {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateRandomPassword
}; 