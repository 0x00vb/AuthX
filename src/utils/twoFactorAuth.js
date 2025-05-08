/**
 * Two-factor authentication utilities
 */
const { authenticator } = require('otplib');
const QRCode = require('qrcode');

/**
 * Generate a secret key for TOTP
 * @returns {string} - Secret key
 */
const generateTOTPSecret = () => {
  return authenticator.generateSecret();
};

/**
 * Generate a QR code for TOTP setup
 * @param {string} email - User email
 * @param {string} secret - TOTP secret key
 * @param {string} [issuer='AuthX'] - Issuer name
 * @returns {Promise<string>} - QR code data URL
 */
const generateTOTPQRCode = async (email, secret, issuer = 'AuthX') => {
  const otpauth = authenticator.keyuri(email, issuer, secret);
  return await QRCode.toDataURL(otpauth);
};

/**
 * Verify a TOTP token
 * @param {string} token - TOTP token
 * @param {string} secret - TOTP secret key
 * @returns {boolean} - Whether the token is valid
 */
const verifyTOTPToken = (token, secret) => {
  return authenticator.verify({ token, secret });
};

/**
 * Generate recovery codes
 * @param {number} [count=8] - Number of recovery codes to generate
 * @returns {Array<string>} - Array of recovery codes
 */
const generateRecoveryCodes = (count = 8) => {
  const codes = [];
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  for (let i = 0; i < count; i++) {
    let code = '';
    
    // Generate a code in the format XXXX-XXXX-XXXX
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 4; k++) {
        code += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      
      if (j < 2) {
        code += '-';
      }
    }
    
    codes.push(code);
  }
  
  return codes;
};

module.exports = {
  generateTOTPSecret,
  generateTOTPQRCode,
  verifyTOTPToken,
  generateRecoveryCodes
}; 