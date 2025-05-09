/**
 * Token Testing Helper
 * 
 * This helper provides utilities for testing token functionality,
 * including creating invalid/expired tokens for testing purposes.
 */

const jwt = require('jsonwebtoken');

class TokenHelper {
  constructor(secretKey = 'test-secret-key') {
    this.secretKey = secretKey;
  }

  /**
   * Parse a JWT token without verification
   * @param {string} token - JWT token to parse
   * @returns {Object} - Decoded token payload
   */
  parseToken(token) {
    try {
      // Split the token and decode the payload (second part)
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = Buffer.from(parts[1], 'base64').toString();
      return JSON.parse(payload);
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }

  /**
   * Verify a JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object|null} - Decoded token payload or null if invalid
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.secretKey);
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }

  /**
   * Create an expired token for testing
   * @param {Object} payload - Token payload
   * @returns {string} - Expired JWT token
   */
  createExpiredToken(payload) {
    // Set expiration to 1 second in the past
    const expiredPayload = {
      ...payload,
      exp: Math.floor(Date.now() / 1000) - 1
    };
    
    return jwt.sign(expiredPayload, this.secretKey);
  }

  /**
   * Create a token with invalid signature for testing
   * @param {Object} payload - Token payload
   * @returns {string} - JWT token with invalid signature
   */
  createInvalidSignatureToken(payload) {
    // Sign with a different secret to create invalid signature
    const wrongSecret = this.secretKey + 'wrong';
    return jwt.sign(payload, wrongSecret);
  }

  /**
   * Create a future-dated token (not valid yet)
   * @param {Object} payload - Token payload
   * @returns {string} - JWT token not valid yet
   */
  createFutureDateToken(payload) {
    // Set not-before to 1 hour in the future
    const futurePayload = {
      ...payload,
      nbf: Math.floor(Date.now() / 1000) + 3600
    };
    
    return jwt.sign(futurePayload, this.secretKey);
  }

  /**
   * Create a valid token with custom expiration
   * @param {Object} payload - Token payload
   * @param {number} expiresIn - Expiration time in seconds
   * @returns {string} - JWT token
   */
  createToken(payload, expiresIn = 900) {
    return jwt.sign(payload, this.secretKey, { expiresIn });
  }
}

module.exports = TokenHelper; 