/**
 * Password Utilities
 */
const bcrypt = require('bcrypt');

const passwordUtils = {
  /**
   * Hash a password
   * @param {String} password - Password to hash
   * @param {Number} saltRounds - Number of salt rounds
   * @returns {Promise<String>} Hashed password
   */
  hashPassword: async (password, saltRounds = 12) => {
    try {
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      throw new Error(`Error hashing password: ${error.message}`);
    }
  },

  /**
   * Compare a password with a hash
   * @param {String} password - Password to compare
   * @param {String} hash - Hash to compare against
   * @returns {Promise<Boolean>} True if password matches hash
   */
  comparePassword: async (password, hash) => {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error(`Error comparing password: ${error.message}`);
    }
  },

  /**
   * Validate password strength
   * @param {String} password - Password to validate
   * @returns {Object} Validation result
   */
  validatePasswordStrength: (password) => {
    const result = {
      isValid: true,
      errors: [],
    };

    // Check length
    if (password.length < 8) {
      result.isValid = false;
      result.errors.push('Password must be at least 8 characters long');
    }

    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one lowercase letter');
    }

    // Check for numbers
    if (!/\d/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one number');
    }

    // Check for special characters
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
    }

    return result;
  },

  /**
   * Generate a random password
   * @param {Number} length - Length of password
   * @returns {String} Generated password
   */
  generateRandomPassword: (length = 12) => {
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const specialChars = '!@#$%^&*()_+[]{}|;:,.<>?';
    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
    
    let password = '';
    
    // Ensure at least one of each character type
    password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
    password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
    password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    
    // Fill the rest with random characters
    for (let i = 4; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  },
};

module.exports = passwordUtils; 