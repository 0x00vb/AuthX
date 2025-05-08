/**
 * Two-Factor Authentication Service
 * Handles TOTP-based two-factor authentication
 */

const {
  generateTOTPSecret,
  generateTOTPQRCode,
  verifyTOTPToken,
  generateRecoveryCodes,
  UserNotFoundError,
  ValidationError,
  InvalidCredentialsError,
  ConfigurationError
} = require('../utils');

/**
 * Create a two-factor authentication service
 * @param {Object} config - Configuration object
 * @param {Object} adapter - Database adapter
 * @returns {Object} - Two-factor authentication service functions
 */
module.exports = (config, adapter) => {
  /**
   * Check if 2FA is enabled for a user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Whether 2FA is enabled
   */
  const isEnabled = async (userId) => {
    // If 2FA is not enabled globally, return false
    if (!config.enable2FA) {
      return false;
    }
    
    // Check if user has 2FA secret
    const secret = await adapter.get2FASecret(userId);
    return !!secret;
  };
  
  /**
   * Generate a new TOTP secret for a user
   * @param {string} userId - User ID
   * @param {string} email - User email (for QR code)
   * @returns {Promise<Object>} - 2FA setup data
   */
  const generateSecret = async (userId, email) => {
    // If 2FA is not enabled globally, throw error
    if (!config.enable2FA) {
      throw new ConfigurationError('Two-factor authentication is not enabled');
    }
    
    // Generate secret
    const secret = generateTOTPSecret();
    
    // Generate QR code
    const qrCode = await generateTOTPQRCode(email, secret);
    
    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes();
    
    // Return setup data (do not store yet until verified)
    return {
      secret,
      qrCode,
      recoveryCodes
    };
  };
  
  /**
   * Enable 2FA for a user after verification
   * @param {string} userId - User ID
   * @param {string} secret - TOTP secret
   * @param {string} token - TOTP token for verification
   * @param {Array<string>} recoveryCodes - Recovery codes
   * @returns {Promise<boolean>} - Whether 2FA was enabled
   */
  const enable = async (userId, secret, token, recoveryCodes) => {
    // If 2FA is not enabled globally, throw error
    if (!config.enable2FA) {
      throw new ConfigurationError('Two-factor authentication is not enabled');
    }
    
    // Verify token
    const isValid = verifyTOTPToken(token, secret);
    if (!isValid) {
      throw new InvalidCredentialsError('Invalid verification code');
    }
    
    // Store 2FA secret and recovery codes
    await adapter.store2FASecret(userId, secret);
    await adapter.storeRecoveryCodes(userId, recoveryCodes);
    
    return true;
  };
  
  /**
   * Disable 2FA for a user
   * @param {string} userId - User ID
   * @param {string} token - TOTP token or recovery code
   * @returns {Promise<boolean>} - Whether 2FA was disabled
   */
  const disable = async (userId, token) => {
    // If 2FA is not enabled globally, return true
    if (!config.enable2FA) {
      return true;
    }
    
    // Check if user has 2FA enabled
    const secret = await adapter.get2FASecret(userId);
    if (!secret) {
      return true; // Already disabled
    }
    
    // Verify token
    let isValid = verifyTOTPToken(token, secret);
    
    // If TOTP token is invalid, try recovery code
    if (!isValid) {
      isValid = await adapter.verifyRecoveryCode(userId, token);
    }
    
    if (!isValid) {
      throw new InvalidCredentialsError('Invalid verification code or recovery code');
    }
    
    // Disable 2FA by storing null secret
    await adapter.store2FASecret(userId, null);
    
    return true;
  };
  
  /**
   * Verify a TOTP token for a user
   * @param {string} userId - User ID
   * @param {string} token - TOTP token or recovery code
   * @returns {Promise<boolean>} - Whether the token is valid
   */
  const verify = async (userId, token) => {
    // If 2FA is not enabled globally, return true
    if (!config.enable2FA) {
      return true;
    }
    
    // Check if user has 2FA enabled
    const secret = await adapter.get2FASecret(userId);
    if (!secret) {
      return true; // 2FA not enabled for user
    }
    
    // Verify token
    let isValid = verifyTOTPToken(token, secret);
    
    // If TOTP token is invalid, try recovery code
    if (!isValid) {
      isValid = await adapter.verifyRecoveryCode(userId, token);
    }
    
    return isValid;
  };
  
  /**
   * Generate new recovery codes for a user
   * @param {string} userId - User ID
   * @param {string} token - TOTP token
   * @returns {Promise<Array<string>>} - New recovery codes
   */
  const generateNewRecoveryCodes = async (userId, token) => {
    // If 2FA is not enabled globally, throw error
    if (!config.enable2FA) {
      throw new ConfigurationError('Two-factor authentication is not enabled');
    }
    
    // Check if user has 2FA enabled
    const secret = await adapter.get2FASecret(userId);
    if (!secret) {
      throw new ValidationError('Two-factor authentication is not enabled for this user');
    }
    
    // Verify token
    const isValid = verifyTOTPToken(token, secret);
    if (!isValid) {
      throw new InvalidCredentialsError('Invalid verification code');
    }
    
    // Generate new recovery codes
    const recoveryCodes = generateRecoveryCodes();
    
    // Store new recovery codes
    await adapter.storeRecoveryCodes(userId, recoveryCodes);
    
    return recoveryCodes;
  };
  
  /**
   * Get recovery codes for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array<string>>} - Recovery codes
   */
  const getRecoveryCodes = async (userId) => {
    // If 2FA is not enabled globally, throw error
    if (!config.enable2FA) {
      throw new ConfigurationError('Two-factor authentication is not enabled');
    }
    
    // Check if user has 2FA enabled
    const secret = await adapter.get2FASecret(userId);
    if (!secret) {
      throw new ValidationError('Two-factor authentication is not enabled for this user');
    }
    
    // Get recovery codes
    const recoveryCodes = await adapter.getRecoveryCodes(userId);
    return recoveryCodes || [];
  };
  
  return {
    isEnabled,
    generateSecret,
    enable,
    disable,
    verify,
    generateNewRecoveryCodes,
    getRecoveryCodes
  };
}; 