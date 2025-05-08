/**
 * MongoDB adapter for Express Auth Toolkit
 * 
 * Note: This adapter assumes you have already set up a MongoDB connection
 * in your application and passed it to the adapter during initialization.
 * 
 * Usage:
 * ```
 * const { MongoClient } = require('mongodb');
 * const { adapters } = require('express-auth-toolkit');
 * 
 * const mongoClient = new MongoClient(process.env.MONGODB_URI);
 * const adapter = adapters.mongo({
 *   client: mongoClient,
 *   dbName: 'myapp'
 * });
 * ```
 */
const AdapterInterface = require('./interface');
const { ConfigurationError } = require('../utils/errors');

/**
 * MongoDB adapter
 * @class
 * @extends AdapterInterface
 */
class MongoAdapter extends AdapterInterface {
  constructor(options = {}) {
    super();
    this.options = options;
    this.client = null;
    this.db = null;
    this.collections = {};
  }

  /**
   * Initialize the adapter
   * @param {Object} config - Adapter configuration
   * @returns {Promise<void>}
   */
  async init(config) {
    if (!this.options.client) {
      throw new ConfigurationError('MongoDB client is required');
    }

    this.client = this.options.client;
    
    // Use provided dbName or default to 'auth'
    const dbName = this.options.dbName || 'auth';
    this.db = this.client.db(dbName);
    
    // Set up collections
    this.collections = {
      users: this.db.collection(this.options.usersCollection || 'users'),
      verificationTokens: this.db.collection(this.options.verificationTokensCollection || 'verification_tokens'),
      passwordResetTokens: this.db.collection(this.options.passwordResetTokensCollection || 'password_reset_tokens'),
      refreshTokens: this.db.collection(this.options.refreshTokensCollection || 'refresh_tokens'),
      blacklistedTokens: this.db.collection(this.options.blacklistedTokensCollection || 'blacklisted_tokens'),
      twoFactorAuth: this.db.collection(this.options.twoFactorAuthCollection || 'two_factor_auth')
    };
    
    // Create indexes
    await Promise.all([
      this.collections.users.createIndex({ email: 1 }, { unique: true }),
      this.collections.verificationTokens.createIndex({ token: 1 }, { unique: true }),
      this.collections.verificationTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      this.collections.passwordResetTokens.createIndex({ token: 1 }, { unique: true }),
      this.collections.passwordResetTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      this.collections.refreshTokens.createIndex({ token: 1 }, { unique: true }),
      this.collections.refreshTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      this.collections.blacklistedTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      this.collections.twoFactorAuth.createIndex({ userId: 1 }, { unique: true })
    ]);
  }

  /**
   * Create a new user
   * @param {Object} user - User data
   * @returns {Promise<Object>} - Created user
   */
  async createUser(user) {
    const result = await this.collections.users.insertOne(user);
    return { ...user, id: result.insertedId.toString() };
  }

  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  async getUserById(id) {
    const user = await this.collections.users.findOne({ _id: id });
    if (!user) return null;
    return { ...user, id: user._id.toString() };
  }

  /**
   * Get a user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  async getUserByEmail(email) {
    const user = await this.collections.users.findOne({ email });
    if (!user) return null;
    return { ...user, id: user._id.toString() };
  }

  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} updates - User data updates
   * @returns {Promise<Object>} - Updated user
   */
  async updateUser(id, updates) {
    const result = await this.collections.users.findOneAndUpdate(
      { _id: id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    
    if (!result.value) return null;
    return { ...result.value, id: result.value._id.toString() };
  }

  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} - Whether the user was deleted
   */
  async deleteUser(id) {
    const result = await this.collections.users.deleteOne({ _id: id });
    return result.deletedCount > 0;
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
    await this.collections.verificationTokens.insertOne(tokenObject);
    return tokenObject;
  }

  /**
   * Get a verification token
   * @param {string} token - Verification token
   * @returns {Promise<Object|null>} - Token object or null if not found
   */
  async getVerificationToken(token) {
    const tokenObject = await this.collections.verificationTokens.findOne({ token });
    return tokenObject;
  }

  /**
   * Delete a verification token
   * @param {string} token - Verification token
   * @returns {Promise<boolean>} - Whether the token was deleted
   */
  async deleteVerificationToken(token) {
    const result = await this.collections.verificationTokens.deleteOne({ token });
    return result.deletedCount > 0;
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
    await this.collections.passwordResetTokens.insertOne(tokenObject);
    return tokenObject;
  }

  /**
   * Get a password reset token
   * @param {string} token - Password reset token
   * @returns {Promise<Object|null>} - Token object or null if not found
   */
  async getPasswordResetToken(token) {
    const tokenObject = await this.collections.passwordResetTokens.findOne({ token });
    return tokenObject;
  }

  /**
   * Delete a password reset token
   * @param {string} token - Password reset token
   * @returns {Promise<boolean>} - Whether the token was deleted
   */
  async deletePasswordResetToken(token) {
    const result = await this.collections.passwordResetTokens.deleteOne({ token });
    return result.deletedCount > 0;
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
    await this.collections.refreshTokens.insertOne(tokenObject);
    return tokenObject;
  }

  /**
   * Get a refresh token
   * @param {string} token - Refresh token
   * @returns {Promise<Object|null>} - Token object or null if not found
   */
  async getRefreshToken(token) {
    const tokenObject = await this.collections.refreshTokens.findOne({ token });
    return tokenObject;
  }

  /**
   * Delete a refresh token
   * @param {string} token - Refresh token
   * @returns {Promise<boolean>} - Whether the token was deleted
   */
  async deleteRefreshToken(token) {
    const result = await this.collections.refreshTokens.deleteOne({ token });
    return result.deletedCount > 0;
  }

  /**
   * Delete all refresh tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Whether the tokens were deleted
   */
  async deleteUserRefreshTokens(userId) {
    const result = await this.collections.refreshTokens.deleteMany({ userId });
    return result.deletedCount > 0;
  }

  /**
   * Store a blacklisted token
   * @param {string} token - Token to blacklist
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise<Object>} - Stored blacklisted token
   */
  async blacklistToken(token, expiresAt) {
    const tokenObject = { token, expiresAt };
    await this.collections.blacklistedTokens.insertOne(tokenObject);
    return tokenObject;
  }

  /**
   * Check if a token is blacklisted
   * @param {string} token - Token to check
   * @returns {Promise<boolean>} - Whether the token is blacklisted
   */
  async isTokenBlacklisted(token) {
    const tokenObject = await this.collections.blacklistedTokens.findOne({ token });
    return !!tokenObject;
  }

  /**
   * Store 2FA secret for a user
   * @param {string} userId - User ID
   * @param {string} secret - 2FA secret
   * @returns {Promise<Object>} - Stored 2FA secret
   */
  async store2FASecret(userId, secret) {
    await this.collections.twoFactorAuth.updateOne(
      { userId },
      { $set: { userId, secret } },
      { upsert: true }
    );
    return { userId, secret };
  }

  /**
   * Get 2FA secret for a user
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} - 2FA secret or null if not found
   */
  async get2FASecret(userId) {
    const result = await this.collections.twoFactorAuth.findOne({ userId });
    return result ? result.secret : null;
  }

  /**
   * Store recovery codes for a user
   * @param {string} userId - User ID
   * @param {Array<string>} codes - Recovery codes
   * @returns {Promise<Object>} - Stored recovery codes
   */
  async storeRecoveryCodes(userId, codes) {
    await this.collections.twoFactorAuth.updateOne(
      { userId },
      { $set: { recoveryCodes: codes } },
      { upsert: true }
    );
    return { userId, codes };
  }

  /**
   * Get recovery codes for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array<string>|null>} - Recovery codes or null if not found
   */
  async getRecoveryCodes(userId) {
    const result = await this.collections.twoFactorAuth.findOne({ userId });
    return result ? result.recoveryCodes : null;
  }

  /**
   * Verify a recovery code for a user
   * @param {string} userId - User ID
   * @param {string} code - Recovery code
   * @returns {Promise<boolean>} - Whether the recovery code is valid
   */
  async verifyRecoveryCode(userId, code) {
    const result = await this.collections.twoFactorAuth.findOne({ userId });
    if (!result || !result.recoveryCodes) {
      return false;
    }
    
    const index = result.recoveryCodes.indexOf(code);
    if (index === -1) {
      return false;
    }
    
    // Remove used code
    result.recoveryCodes.splice(index, 1);
    await this.collections.twoFactorAuth.updateOne(
      { userId },
      { $set: { recoveryCodes: result.recoveryCodes } }
    );
    
    return true;
  }

  /**
   * Close the database connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.client && this.options.closeConnection) {
      await this.client.close();
    }
  }
}

/**
 * Create a new MongoDB adapter
 * @param {Object} options - Adapter options
 * @returns {MongoAdapter} - MongoDB adapter instance
 */
module.exports = (options = {}) => new MongoAdapter(options); 