/**
 * Two-Factor Authentication Service
 */
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class TwoFactorService {
  constructor(options = {}) {
    this.dbAdapter = options.dbAdapter;
    this.config = options.config;
  }

  /**
   * Enable 2FA for a user
   * @param {String} userId - User ID
   * @returns {Object} Secret and QR code URL
   */
  async enable2FA(userId) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      // Find user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate a secret
      const secret = this._generateSecret();
      
      // Generate recovery codes
      const recoveryCodes = this._generateRecoveryCodes();
      
      // Update user
      user.twoFactorSecret = secret;
      user.recoveryCodes = recoveryCodes;
      await user.save();
      
      // Return secret and qr code URL
      return {
        secret,
        recoveryCodes,
        qrCodeUrl: `otpauth://totp/AuthX:${user.email}?secret=${secret}&issuer=AuthX`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify 2FA code
   * @param {String} userId - User ID
   * @param {String} code - 2FA code
   * @returns {Boolean} True if code is valid
   */
  async verify2FACode(userId, code) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      // Find user
      const user = await User.findById(userId);
      if (!user || !user.twoFactorSecret) {
        throw new Error('User not found or 2FA not enabled');
      }
      
      // Verify code
      return this._verifyCode(user.twoFactorSecret, code);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Complete 2FA setup
   * @param {String} userId - User ID
   * @param {String} code - 2FA code
   * @returns {Object} Success message
   */
  async complete2FASetup(userId, code) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      // Find user
      const user = await User.findById(userId);
      if (!user || !user.twoFactorSecret) {
        throw new Error('User not found or 2FA not enabled');
      }
      
      // Verify code
      const isValid = this._verifyCode(user.twoFactorSecret, code);
      if (!isValid) {
        throw new Error('Invalid 2FA code');
      }
      
      // Enable 2FA
      user.twoFactorEnabled = true;
      await user.save();
      
      return {
        message: '2FA enabled successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Disable 2FA for a user
   * @param {String} userId - User ID
   * @returns {Object} Success message
   */
  async disable2FA(userId) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      // Find user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Disable 2FA
      user.twoFactorEnabled = false;
      user.twoFactorSecret = undefined;
      user.recoveryCodes = [];
      await user.save();
      
      return {
        message: '2FA disabled successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Use recovery code
   * @param {String} userId - User ID
   * @param {String} recoveryCode - Recovery code
   * @returns {Object} Success message
   */
  async useRecoveryCode(userId, recoveryCode) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      // Find user
      const user = await User.findById(userId);
      if (!user || !user.twoFactorEnabled) {
        throw new Error('User not found or 2FA not enabled');
      }
      
      // Check if recovery code exists
      const recoveryCodeIndex = user.recoveryCodes.indexOf(recoveryCode);
      if (recoveryCodeIndex === -1) {
        throw new Error('Invalid recovery code');
      }
      
      // Remove used recovery code
      user.recoveryCodes.splice(recoveryCodeIndex, 1);
      await user.save();
      
      return {
        message: 'Recovery code used successfully',
        remainingCodes: user.recoveryCodes.length,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate new recovery codes
   * @param {String} userId - User ID
   * @returns {Array} New recovery codes
   */
  async generateNewRecoveryCodes(userId) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      // Find user
      const user = await User.findById(userId);
      if (!user || !user.twoFactorEnabled) {
        throw new Error('User not found or 2FA not enabled');
      }
      
      // Generate new recovery codes
      const recoveryCodes = this._generateRecoveryCodes();
      
      // Update user
      user.recoveryCodes = recoveryCodes;
      await user.save();
      
      return {
        recoveryCodes,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate a secure secret
   * @returns {String} Secure secret
   * @private
   */
  _generateSecret() {
    return crypto.randomBytes(20).toString('hex');
  }

  /**
   * Generate recovery codes
   * @returns {Array} Array of recovery codes
   * @private
   */
  _generateRecoveryCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(this._generateRecoveryCode());
    }
    return codes;
  }

  /**
   * Generate a single recovery code
   * @returns {String} Recovery code
   * @private
   */
  _generateRecoveryCode() {
    return uuidv4().replace(/-/g, '').substring(0, 10).toUpperCase();
  }

  /**
   * Verify a TOTP code
   * @param {String} secret - User's 2FA secret
   * @param {String} code - Code to verify
   * @returns {Boolean} True if code is valid
   * @private
   */
  _verifyCode(secret, code) {
    // This is a simplified implementation
    // In a production environment, you should use a proper TOTP library
    // like 'speakeasy' or 'otplib'
    const expectedCode = this._generateTOTP(secret);
    return code === expectedCode;
  }

  /**
   * Generate a TOTP code
   * @param {String} secret - User's 2FA secret
   * @returns {String} TOTP code
   * @private
   */
  _generateTOTP(secret) {
    // This is a simplified implementation
    // In a production environment, you should use a proper TOTP library
    
    // Get current time window (30 seconds)
    const timeWindow = Math.floor(Date.now() / 30000);
    
    // Create HMAC using the secret and time window
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(Buffer.from(timeWindow.toString()));
    const hmacResult = hmac.digest('hex');
    
    // Take 6 characters from the result
    const code = parseInt(hmacResult.substring(0, 6), 16) % 1000000;
    
    // Pad with zeros if needed
    return code.toString().padStart(6, '0');
  }
}

module.exports = TwoFactorService; 