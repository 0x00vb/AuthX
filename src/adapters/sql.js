/**
 * SQL adapter for Express Auth Toolkit using Sequelize ORM
 * 
 * Note: This adapter assumes you have already set up Sequelize in your application
 * and pass the Sequelize instance to the adapter during initialization.
 * 
 * Usage:
 * ```
 * const { Sequelize } = require('sequelize');
 * const { adapters } = require('express-auth-toolkit');
 * 
 * const sequelize = new Sequelize(process.env.DATABASE_URL);
 * const adapter = adapters.sql({
 *   sequelize,
 *   tablePrefix: 'auth_' // optional
 * });
 * ```
 */
const AdapterInterface = require('./interface');
const { ConfigurationError } = require('../utils/errors');

/**
 * SQL adapter
 * @class
 * @extends AdapterInterface
 */
class SQLAdapter extends AdapterInterface {
  constructor(options = {}) {
    super();
    this.options = options;
    this.sequelize = null;
    this.models = {};
  }

  /**
   * Initialize the adapter
   * @param {Object} config - Adapter configuration
   * @returns {Promise<void>}
   */
  async init(config) {
    if (!this.options.sequelize) {
      throw new ConfigurationError('Sequelize instance is required');
    }

    this.sequelize = this.options.sequelize;
    const { DataTypes } = this.sequelize.Sequelize;
    const prefix = this.options.tablePrefix || '';
    
    // Define User model
    this.models.User = this.sequelize.define(`${prefix}User`, {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: 'user'
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
      }
    }, {
      tableName: `${prefix}users`,
      timestamps: true
    });
    
    // Define VerificationToken model
    this.models.VerificationToken = this.sequelize.define(`${prefix}VerificationToken`, {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: `${prefix}users`,
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    }, {
      tableName: `${prefix}verification_tokens`,
      timestamps: true,
      indexes: [
        {
          name: `${prefix}verification_tokens_token_idx`,
          unique: true,
          fields: ['token']
        },
        {
          name: `${prefix}verification_tokens_expires_idx`,
          fields: ['expiresAt']
        }
      ]
    });
    
    // Define PasswordResetToken model
    this.models.PasswordResetToken = this.sequelize.define(`${prefix}PasswordResetToken`, {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: `${prefix}users`,
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    }, {
      tableName: `${prefix}password_reset_tokens`,
      timestamps: true,
      indexes: [
        {
          name: `${prefix}password_reset_tokens_token_idx`,
          unique: true,
          fields: ['token']
        },
        {
          name: `${prefix}password_reset_tokens_expires_idx`,
          fields: ['expiresAt']
        }
      ]
    });
    
    // Define RefreshToken model
    this.models.RefreshToken = this.sequelize.define(`${prefix}RefreshToken`, {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: `${prefix}users`,
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    }, {
      tableName: `${prefix}refresh_tokens`,
      timestamps: true,
      indexes: [
        {
          name: `${prefix}refresh_tokens_token_idx`,
          unique: true,
          fields: ['token']
        },
        {
          name: `${prefix}refresh_tokens_expires_idx`,
          fields: ['expiresAt']
        }
      ]
    });
    
    // Define BlacklistedToken model
    this.models.BlacklistedToken = this.sequelize.define(`${prefix}BlacklistedToken`, {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    }, {
      tableName: `${prefix}blacklisted_tokens`,
      timestamps: true,
      indexes: [
        {
          name: `${prefix}blacklisted_tokens_token_idx`,
          unique: true,
          fields: ['token']
        },
        {
          name: `${prefix}blacklisted_tokens_expires_idx`,
          fields: ['expiresAt']
        }
      ]
    });
    
    // Define TwoFactorAuth model
    this.models.TwoFactorAuth = this.sequelize.define(`${prefix}TwoFactorAuth`, {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: `${prefix}users`,
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      secret: {
        type: DataTypes.STRING,
        allowNull: true
      },
      recoveryCodes: {
        type: DataTypes.JSON,
        allowNull: true
      }
    }, {
      tableName: `${prefix}two_factor_auth`,
      timestamps: true,
      indexes: [
        {
          name: `${prefix}two_factor_auth_user_idx`,
          unique: true,
          fields: ['userId']
        }
      ]
    });
    
    // Set up relationships
    this.models.User.hasMany(this.models.VerificationToken, { foreignKey: 'userId', as: 'verificationTokens' });
    this.models.User.hasMany(this.models.PasswordResetToken, { foreignKey: 'userId', as: 'passwordResetTokens' });
    this.models.User.hasMany(this.models.RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
    this.models.User.hasOne(this.models.TwoFactorAuth, { foreignKey: 'userId', as: 'twoFactorAuth' });
    
    // Create tables if they don't exist
    if (this.options.syncModels) {
      await this.sequelize.sync({ alter: this.options.alterModels });
    }
  }
  
  /**
   * Create a new user
   * @param {Object} user - User data
   * @returns {Promise<Object>} - Created user
   */
  async createUser(user) {
    const createdUser = await this.models.User.create(user);
    return createdUser.toJSON();
  }

  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  async getUserById(id) {
    const user = await this.models.User.findByPk(id);
    return user ? user.toJSON() : null;
  }

  /**
   * Get a user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  async getUserByEmail(email) {
    const user = await this.models.User.findOne({ where: { email } });
    return user ? user.toJSON() : null;
  }

  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} updates - User data updates
   * @returns {Promise<Object>} - Updated user
   */
  async updateUser(id, updates) {
    const [updated] = await this.models.User.update(updates, { where: { id } });
    if (!updated) return null;
    
    const user = await this.models.User.findByPk(id);
    return user.toJSON();
  }

  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} - Whether the user was deleted
   */
  async deleteUser(id) {
    const deleted = await this.models.User.destroy({ where: { id } });
    return !!deleted;
  }

  /**
   * Store a verification token
   * @param {string} userId - User ID
   * @param {string} token - Verification token
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise<Object>} - Stored token
   */
  async storeVerificationToken(userId, token, expiresAt) {
    const storedToken = await this.models.VerificationToken.create({
      userId,
      token,
      expiresAt
    });
    
    return storedToken.toJSON();
  }

  /**
   * Get a verification token
   * @param {string} token - Verification token
   * @returns {Promise<Object|null>} - Token object or null if not found
   */
  async getVerificationToken(token) {
    const verificationToken = await this.models.VerificationToken.findOne({
      where: {
        token,
        expiresAt: { [this.sequelize.Sequelize.Op.gt]: new Date() }
      }
    });
    
    return verificationToken ? verificationToken.toJSON() : null;
  }

  /**
   * Delete a verification token
   * @param {string} token - Verification token
   * @returns {Promise<boolean>} - Whether the token was deleted
   */
  async deleteVerificationToken(token) {
    const deleted = await this.models.VerificationToken.destroy({ where: { token } });
    return !!deleted;
  }

  /**
   * Store a password reset token
   * @param {string} userId - User ID
   * @param {string} token - Password reset token
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise<Object>} - Stored token
   */
  async storePasswordResetToken(userId, token, expiresAt) {
    const storedToken = await this.models.PasswordResetToken.create({
      userId,
      token,
      expiresAt
    });
    
    return storedToken.toJSON();
  }

  /**
   * Get a password reset token
   * @param {string} token - Password reset token
   * @returns {Promise<Object|null>} - Token object or null if not found
   */
  async getPasswordResetToken(token) {
    const resetToken = await this.models.PasswordResetToken.findOne({
      where: {
        token,
        expiresAt: { [this.sequelize.Sequelize.Op.gt]: new Date() }
      }
    });
    
    return resetToken ? resetToken.toJSON() : null;
  }

  /**
   * Delete a password reset token
   * @param {string} token - Password reset token
   * @returns {Promise<boolean>} - Whether the token was deleted
   */
  async deletePasswordResetToken(token) {
    const deleted = await this.models.PasswordResetToken.destroy({ where: { token } });
    return !!deleted;
  }

  /**
   * Store a refresh token
   * @param {string} userId - User ID
   * @param {string} token - Refresh token
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise<Object>} - Stored token
   */
  async storeRefreshToken(userId, token, expiresAt) {
    const storedToken = await this.models.RefreshToken.create({
      userId,
      token,
      expiresAt
    });
    
    return storedToken.toJSON();
  }

  /**
   * Get a refresh token
   * @param {string} token - Refresh token
   * @returns {Promise<Object|null>} - Token object or null if not found
   */
  async getRefreshToken(token) {
    const refreshToken = await this.models.RefreshToken.findOne({
      where: {
        token,
        expiresAt: { [this.sequelize.Sequelize.Op.gt]: new Date() }
      }
    });
    
    return refreshToken ? refreshToken.toJSON() : null;
  }

  /**
   * Delete a refresh token
   * @param {string} token - Refresh token
   * @returns {Promise<boolean>} - Whether the token was deleted
   */
  async deleteRefreshToken(token) {
    const deleted = await this.models.RefreshToken.destroy({ where: { token } });
    return !!deleted;
  }

  /**
   * Delete all refresh tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Whether the tokens were deleted
   */
  async deleteUserRefreshTokens(userId) {
    const deleted = await this.models.RefreshToken.destroy({ where: { userId } });
    return !!deleted;
  }

  /**
   * Store a blacklisted token
   * @param {string} token - Token to blacklist
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise<Object>} - Stored blacklisted token
   */
  async blacklistToken(token, expiresAt) {
    const blacklistedToken = await this.models.BlacklistedToken.create({
      token,
      expiresAt
    });
    
    return blacklistedToken.toJSON();
  }

  /**
   * Check if a token is blacklisted
   * @param {string} token - Token to check
   * @returns {Promise<boolean>} - Whether the token is blacklisted
   */
  async isTokenBlacklisted(token) {
    const blacklistedToken = await this.models.BlacklistedToken.findOne({
      where: {
        token,
        expiresAt: { [this.sequelize.Sequelize.Op.gt]: new Date() }
      }
    });
    
    return !!blacklistedToken;
  }

  /**
   * Store 2FA secret for a user
   * @param {string} userId - User ID
   * @param {string} secret - 2FA secret
   * @returns {Promise<Object>} - Stored 2FA secret
   */
  async store2FASecret(userId, secret) {
    const [twoFactorAuth, created] = await this.models.TwoFactorAuth.findOrCreate({
      where: { userId },
      defaults: { userId, secret }
    });
    
    if (!created) {
      twoFactorAuth.secret = secret;
      await twoFactorAuth.save();
    }
    
    return twoFactorAuth.toJSON();
  }

  /**
   * Get 2FA secret for a user
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} - 2FA secret or null if not found
   */
  async get2FASecret(userId) {
    const twoFactorAuth = await this.models.TwoFactorAuth.findOne({ where: { userId } });
    return twoFactorAuth ? twoFactorAuth.secret : null;
  }

  /**
   * Store recovery codes for a user
   * @param {string} userId - User ID
   * @param {Array<string>} codes - Recovery codes
   * @returns {Promise<Object>} - Stored recovery codes
   */
  async storeRecoveryCodes(userId, codes) {
    const [twoFactorAuth, created] = await this.models.TwoFactorAuth.findOrCreate({
      where: { userId },
      defaults: { userId, recoveryCodes: codes }
    });
    
    if (!created) {
      twoFactorAuth.recoveryCodes = codes;
      await twoFactorAuth.save();
    }
    
    return twoFactorAuth.toJSON();
  }

  /**
   * Get recovery codes for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array<string>|null>} - Recovery codes or null if not found
   */
  async getRecoveryCodes(userId) {
    const twoFactorAuth = await this.models.TwoFactorAuth.findOne({ where: { userId } });
    return twoFactorAuth ? twoFactorAuth.recoveryCodes : null;
  }

  /**
   * Verify a recovery code for a user
   * @param {string} userId - User ID
   * @param {string} code - Recovery code
   * @returns {Promise<boolean>} - Whether the recovery code is valid
   */
  async verifyRecoveryCode(userId, code) {
    const twoFactorAuth = await this.models.TwoFactorAuth.findOne({ where: { userId } });
    
    if (!twoFactorAuth || !twoFactorAuth.recoveryCodes) {
      return false;
    }
    
    const codes = twoFactorAuth.recoveryCodes;
    const index = codes.indexOf(code);
    
    if (index === -1) {
      return false;
    }
    
    // Remove used code
    codes.splice(index, 1);
    twoFactorAuth.recoveryCodes = codes;
    await twoFactorAuth.save();
    
    return true;
  }

  /**
   * Close the database connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.sequelize && this.options.closeConnection) {
      await this.sequelize.close();
    }
  }
}

/**
 * Create a new SQL adapter
 * @param {Object} options - Adapter options
 * @returns {SQLAdapter} - SQL adapter instance
 */
module.exports = (options = {}) => new SQLAdapter(options); 