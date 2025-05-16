/**
 * Token Utilities
 */
const jwt = require('jsonwebtoken');

const tokenUtils = {
  /**
   * Generate a JWT token
   * @param {Object} payload - Token payload
   * @param {String} secret - Secret to sign the token
   * @param {Object} options - JWT options
   * @returns {String} JWT token
   */
  generateToken: (payload, secret, options = {}) => {
    try {
      return jwt.sign(payload, secret, options);
    } catch (error) {
      throw new Error(`Error generating token: ${error.message}`);
    }
  },

  /**
   * Verify a JWT token
   * @param {String} token - JWT token
   * @param {String} secret - Secret used to sign the token
   * @returns {Object} Decoded token payload
   */
  verifyToken: (token, secret) => {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }
  },

  /**
   * Decode a JWT token without verification
   * @param {String} token - JWT token
   * @returns {Object} Decoded token payload
   */
  decodeToken: (token) => {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error(`Error decoding token: ${error.message}`);
    }
  },

  /**
   * Get expiry date from token
   * @param {String} token - JWT token
   * @returns {Date} Expiry date
   */
  getTokenExpiry: (token) => {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        throw new Error('Token does not contain expiry');
      }
      return new Date(decoded.exp * 1000);
    } catch (error) {
      throw new Error(`Error getting token expiry: ${error.message}`);
    }
  },

  /**
   * Check if token is expired
   * @param {String} token - JWT token
   * @returns {Boolean} True if token is expired
   */
  isTokenExpired: (token) => {
    try {
      const expiryDate = tokenUtils.getTokenExpiry(token);
      return expiryDate < new Date();
    } catch (error) {
      throw new Error(`Error checking token expiry: ${error.message}`);
    }
  },

  /**
   * Generate a random token
   * @param {Number} length - Length of token in bytes
   * @returns {String} Random token
   */
  generateRandomToken: (length = 32) => {
    try {
      return require('crypto').randomBytes(length).toString('hex');
    } catch (error) {
      throw new Error(`Error generating random token: ${error.message}`);
    }
  },
};

module.exports = tokenUtils; 