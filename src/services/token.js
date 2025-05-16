/**
 * Token Service
 */
class TokenService {
  constructor(options = {}) {
    this.dbAdapter = options.dbAdapter;
  }

  /**
   * Save token to database
   * @param {Object} tokenData - Token data
   * @returns {Object} Saved token
   */
  async saveToken(tokenData) {
    try {
      const Token = this.dbAdapter.getModel('Token');
      
      const token = new Token({
        token: tokenData.token,
        type: tokenData.type,
        userId: tokenData.userId,
        expiresAt: tokenData.expiresAt,
      });
      
      return await token.save();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if token is blacklisted
   * @param {String} token - Token to check
   * @returns {Boolean} True if blacklisted
   */
  async isTokenBlacklisted(token) {
    try {
      const Token = this.dbAdapter.getModel('Token');
      
      const tokenDoc = await Token.findOne({ token });
      
      return tokenDoc && tokenDoc.blacklisted;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Blacklist a token
   * @param {String} token - Token to blacklist
   * @returns {Object} Updated token
   */
  async blacklistToken(token) {
    try {
      const Token = this.dbAdapter.getModel('Token');
      
      const tokenDoc = await Token.findOne({ token });
      
      if (!tokenDoc) {
        throw new Error('Token not found');
      }
      
      tokenDoc.blacklisted = true;
      return await tokenDoc.save();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Blacklist all tokens for a user
   * @param {String} userId - User ID
   * @returns {Object} Result of the operation
   */
  async blacklistAllUserTokens(userId) {
    try {
      const Token = this.dbAdapter.getModel('Token');
      
      return await Token.updateMany(
        { userId },
        { blacklisted: true }
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete expired tokens
   * @returns {Object} Result of the operation
   */
  async deleteExpiredTokens() {
    try {
      const Token = this.dbAdapter.getModel('Token');
      
      return await Token.deleteMany({
        expiresAt: { $lt: new Date() },
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TokenService; 