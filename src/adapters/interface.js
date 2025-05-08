/**
 * Database adapter interface
 * Defines the methods that all database adapters must implement
 */

/**
 * Adapter interface class
 * @class
 */
class AdapterInterface {
  /**
   * Initialize the adapter
   * @param {Object} config - Adapter configuration
   * @returns {Promise<void>}
   */
  async init(config) {
    throw new Error('Method not implemented: init');
  }

  /**
   * Create a new user
   * @param {Object} user - User data
   * @returns {Promise<Object>} - Created user
   */
  async createUser(user) {
    throw new Error('Method not implemented: createUser');
  }

  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  async getUserById(id) {
    throw new Error('Method not implemented: getUserById');
  }

  /**
   * Get a user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  async getUserByEmail(email) {
    throw new Error('Method not implemented: getUserByEmail');
  }

  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} updates - User data updates
   * @returns {Promise<Object>} - Updated user
   */
  async updateUser(id, updates) {
    throw new Error('Method not implemented: updateUser');
  }

  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} - Whether the user was deleted
   */
  async deleteUser(id) {
    throw new Error('Method not implemented: deleteUser');
  }

  /**
   * Store a verification token
   * @param {string} userId - User ID
   * @param {string} token - Verification token
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise<Object>} - Stored token
   */
  async storeVerificationToken(userId, token, expiresAt) {
    throw new Error('Method not implemented: storeVerificationToken');
  }

  /**
   * Get a verification token
   * @param {string} token - Verification token
   * @returns {Promise<Object|null>} - Token object or null if not found
   */
  async getVerificationToken(token) {
    throw new Error('Method not implemented: getVerificationToken');
  }

  /**
   * Delete a verification token
   * @param {string} token - Verification token
   * @returns {Promise<boolean>} - Whether the token was deleted
   */
  async deleteVerificationToken(token) {
    throw new Error('Method not implemented: deleteVerificationToken');
  }

  /**
   * Store a password reset token
   * @param {string} userId - User ID
   * @param {string} token - Password reset token
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise<Object>} - Stored token
   */
  async storePasswordResetToken(userId, token, expiresAt) {
    throw new Error('Method not implemented: storePasswordResetToken');
  }

  /**
   * Get a password reset token
   * @param {string} token - Password reset token
   * @returns {Promise<Object|null>} - Token object or null if not found
   */
  async getPasswordResetToken(token) {
    throw new Error('Method not implemented: getPasswordResetToken');
  }

  /**
   * Delete a password reset token
   * @param {string} token - Password reset token
   * @returns {Promise<boolean>} - Whether the token was deleted
   */
  async deletePasswordResetToken(token) {
    throw new Error('Method not implemented: deletePasswordResetToken');
  }

  /**
   * Store a refresh token
   * @param {string} userId - User ID
   * @param {string} token - Refresh token
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise<Object>} - Stored token
   */
  async storeRefreshToken(userId, token, expiresAt) {
    throw new Error('Method not implemented: storeRefreshToken');
  }

  /**
   * Get a refresh token
   * @param {string} token - Refresh token
   * @returns {Promise<Object|null>} - Token object or null if not found
   */
  async getRefreshToken(token) {
    throw new Error('Method not implemented: getRefreshToken');
  }

  /**
   * Delete a refresh token
   * @param {string} token - Refresh token
   * @returns {Promise<boolean>} - Whether the token was deleted
   */
  async deleteRefreshToken(token) {
    throw new Error('Method not implemented: deleteRefreshToken');
  }

  /**
   * Delete all refresh tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Whether the tokens were deleted
   */
  async deleteUserRefreshTokens(userId) {
    throw new Error('Method not implemented: deleteUserRefreshTokens');
  }

  /**
   * Store a blacklisted token
   * @param {string} token - Token to blacklist
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise<Object>} - Stored blacklisted token
   */
  async blacklistToken(token, expiresAt) {
    throw new Error('Method not implemented: blacklistToken');
  }

  /**
   * Check if a token is blacklisted
   * @param {string} token - Token to check
   * @returns {Promise<boolean>} - Whether the token is blacklisted
   */
  async isTokenBlacklisted(token) {
    throw new Error('Method not implemented: isTokenBlacklisted');
  }

  /**
   * Store 2FA secret for a user
   * @param {string} userId - User ID
   * @param {string} secret - 2FA secret
   * @returns {Promise<Object>} - Stored 2FA secret
   */
  async store2FASecret(userId, secret) {
    throw new Error('Method not implemented: store2FASecret');
  }

  /**
   * Get 2FA secret for a user
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} - 2FA secret or null if not found
   */
  async get2FASecret(userId) {
    throw new Error('Method not implemented: get2FASecret');
  }

  /**
   * Store recovery codes for a user
   * @param {string} userId - User ID
   * @param {Array<string>} codes - Recovery codes
   * @returns {Promise<Object>} - Stored recovery codes
   */
  async storeRecoveryCodes(userId, codes) {
    throw new Error('Method not implemented: storeRecoveryCodes');
  }

  /**
   * Get recovery codes for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array<string>|null>} - Recovery codes or null if not found
   */
  async getRecoveryCodes(userId) {
    throw new Error('Method not implemented: getRecoveryCodes');
  }

  /**
   * Verify a recovery code for a user
   * @param {string} userId - User ID
   * @param {string} code - Recovery code
   * @returns {Promise<boolean>} - Whether the recovery code is valid
   */
  async verifyRecoveryCode(userId, code) {
    throw new Error('Method not implemented: verifyRecoveryCode');
  }

  /**
   * Close the database connection
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('Method not implemented: close');
  }
}

module.exports = AdapterInterface; 