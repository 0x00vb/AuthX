/**
 * In-memory database adapter
 * Useful for testing and development
 */
const { v4: uuidv4 } = require('uuid');
const AdapterInterface = require('./interface');

/**
 * In-memory adapter
 * @class
 * @extends AdapterInterface
 */
class MemoryAdapter extends AdapterInterface {
  constructor() {
    super();
    this.users = new Map();
    this.verificationTokens = new Map();
    this.passwordResetTokens = new Map();
    this.refreshTokens = new Map();
    this.blacklistedTokens = new Map();
    this.twoFactorSecrets = new Map();
    this.recoveryCodes = new Map();
  }

  /**
   * Initialize the adapter
   * @param {Object} config - Adapter configuration
   * @returns {Promise<void>}
   */
  async init() {
    // No initialization needed for in-memory adapter
    return Promise.resolve();
  }

  /**
   * Create a new user
   * @param {Object} user - User data
   * @returns {Promise<Object>} - Created user
   */
  async createUser(user) {
    const id = user.id || uuidv4();
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return Promise.resolve(newUser);
  }

  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  async getUserById(id) {
    const user = this.users.get(id) || null;
    return Promise.resolve(user);
  }

  /**
   * Get a user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  async getUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return Promise.resolve(user);
      }
    }
    return Promise.resolve(null);
  }

  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} updates - User data updates
   * @returns {Promise<Object>} - Updated user
   */
  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) {
      return Promise.resolve(null);
    }
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return Promise.resolve(updatedUser);
  }

  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} - Whether the user was deleted
   */
  async deleteUser(id) {
    const deleted = this.users.delete(id);
    return Promise.resolve(deleted);
  }

  /**
   * Store a verification token
   * @param {string} userId - User ID
   * @param {string} token - Verification token
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise<Object>} - Stored token
   */
  async storeVerificationToken(userId, token, expiresAt) {
    const tokenObject = { userId, token, expiresAt };
    this.verificationTokens.set(token, tokenObject);
    return Promise.resolve(tokenObject);
  }

  /**
   * Get a verification token
   * @param {string} token - Verification token
   * @returns {Promise<Object|null>} - Token object or null if not found
   */
  async getVerificationToken(token) {
    const tokenObject = this.verificationTokens.get(token) || null;
    
    // Check if token is expired
    if (tokenObject && tokenObject.expiresAt < new Date()) {
      this.verificationTokens.delete(token);
      return Promise.resolve(null);
    }
    
    return Promise.resolve(tokenObject);
  }

  /**
   * Delete a verification token
   * @param {string} token - Verification token
   * @returns {Promise<boolean>} - Whether the token was deleted
   */
  async deleteVerificationToken(token) {
    const deleted = this.verificationTokens.delete(token);
    return Promise.resolve(deleted);
  }

  /**
   * Store a password reset token
   * @param {string} userId - User ID
   * @param {string} token - Password reset token
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise<Object>} - Stored token
   */
  async storePasswordResetToken(userId, token, expiresAt) {
    const tokenObject = { userId, token, expiresAt };
    this.passwordResetTokens.set(token, tokenObject);
    return Promise.resolve(tokenObject);
  }

  /**
   * Get a password reset token
   * @param {string} token - Password reset token
   * @returns {Promise<Object|null>} - Token object or null if not found
   */
  async getPasswordResetToken(token) {
    const tokenObject = this.passwordResetTokens.get(token) || null;
    
    // Check if token is expired
    if (tokenObject && tokenObject.expiresAt < new Date()) {
      this.passwordResetTokens.delete(token);
      return Promise.resolve(null);
    }
    
    return Promise.resolve(tokenObject);
  }

  /**
   * Delete a password reset token
   * @param {string} token - Password reset token
   * @returns {Promise<boolean>} - Whether the token was deleted
   */
  async deletePasswordResetToken(token) {
    const deleted = this.passwordResetTokens.delete(token);
    return Promise.resolve(deleted);
  }

  /**
   * Store a refresh token
   * @param {string} userId - User ID
   * @param {string} token - Refresh token
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise<Object>} - Stored token
   */
  async storeRefreshToken(userId, token, expiresAt) {
    const tokenObject = { userId, token, expiresAt };
    this.refreshTokens.set(token, tokenObject);
    return Promise.resolve(tokenObject);
  }

  /**
   * Get a refresh token
   * @param {string} token - Refresh token
   * @returns {Promise<Object|null>} - Token object or null if not found
   */
  async getRefreshToken(token) {
    const tokenObject = this.refreshTokens.get(token) || null;
    
    // Check if token is expired
    if (tokenObject && tokenObject.expiresAt < new Date()) {
      this.refreshTokens.delete(token);
      return Promise.resolve(null);
    }
    
    return Promise.resolve(tokenObject);
  }

  /**
   * Delete a refresh token
   * @param {string} token - Refresh token
   * @returns {Promise<boolean>} - Whether the token was deleted
   */
  async deleteRefreshToken(token) {
    const deleted = this.refreshTokens.delete(token);
    return Promise.resolve(deleted);
  }

  /**
   * Delete all refresh tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Whether the tokens were deleted
   */
  async deleteUserRefreshTokens(userId) {
    let deleted = false;
    
    for (const [token, obj] of this.refreshTokens.entries()) {
      if (obj.userId === userId) {
        this.refreshTokens.delete(token);
        deleted = true;
      }
    }
    
    return Promise.resolve(deleted);
  }

  /**
   * Store a blacklisted token
   * @param {string} token - Token to blacklist
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise<Object>} - Stored blacklisted token
   */
  async blacklistToken(token, expiresAt) {
    const tokenObject = { token, expiresAt };
    this.blacklistedTokens.set(token, tokenObject);
    return Promise.resolve(tokenObject);
  }

  /**
   * Check if a token is blacklisted
   * @param {string} token - Token to check
   * @returns {Promise<boolean>} - Whether the token is blacklisted
   */
  async isTokenBlacklisted(token) {
    const tokenObject = this.blacklistedTokens.get(token);
    
    if (!tokenObject) {
      return Promise.resolve(false);
    }
    
    // If token is expired, remove it from blacklist
    if (tokenObject.expiresAt < new Date()) {
      this.blacklistedTokens.delete(token);
      return Promise.resolve(false);
    }
    
    return Promise.resolve(true);
  }

  /**
   * Store 2FA secret for a user
   * @param {string} userId - User ID
   * @param {string} secret - 2FA secret
   * @returns {Promise<Object>} - Stored 2FA secret
   */
  async store2FASecret(userId, secret) {
    this.twoFactorSecrets.set(userId, secret);
    return Promise.resolve({ userId, secret });
  }

  /**
   * Get 2FA secret for a user
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} - 2FA secret or null if not found
   */
  async get2FASecret(userId) {
    const secret = this.twoFactorSecrets.get(userId) || null;
    return Promise.resolve(secret);
  }

  /**
   * Store recovery codes for a user
   * @param {string} userId - User ID
   * @param {Array<string>} codes - Recovery codes
   * @returns {Promise<Object>} - Stored recovery codes
   */
  async storeRecoveryCodes(userId, codes) {
    this.recoveryCodes.set(userId, codes);
    return Promise.resolve({ userId, codes });
  }

  /**
   * Get recovery codes for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array<string>|null>} - Recovery codes or null if not found
   */
  async getRecoveryCodes(userId) {
    const codes = this.recoveryCodes.get(userId) || null;
    return Promise.resolve(codes);
  }

  /**
   * Verify a recovery code for a user
   * @param {string} userId - User ID
   * @param {string} code - Recovery code
   * @returns {Promise<boolean>} - Whether the recovery code is valid
   */
  async verifyRecoveryCode(userId, code) {
    const codes = this.recoveryCodes.get(userId);
    if (!codes) {
      return Promise.resolve(false);
    }
    
    const index = codes.indexOf(code);
    if (index === -1) {
      return Promise.resolve(false);
    }
    
    // Remove used code
    codes.splice(index, 1);
    this.recoveryCodes.set(userId, codes);
    
    return Promise.resolve(true);
  }

  /**
   * Close the database connection
   * @returns {Promise<void>}
   */
  async close() {
    // No connection to close for in-memory adapter
    return Promise.resolve();
  }

  /**
   * Clear all data from the in-memory database
   * Useful for testing
   * @returns {Promise<void>}
   */
  async clear() {
    this.users.clear();
    this.verificationTokens.clear();
    this.passwordResetTokens.clear();
    this.refreshTokens.clear();
    this.blacklistedTokens.clear();
    this.twoFactorSecrets.clear();
    this.recoveryCodes.clear();
    return Promise.resolve();
  }
}

module.exports = () => new MemoryAdapter(); 