/**
 * Email Service
 * Handles sending authentication-related emails
 */

const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
} = require('../utils/email');
const nodemailer = require('nodemailer');

/**
 * Create an email service
 * @param {Object} config - Configuration object
 * @returns {Object} - Email service functions
 */
module.exports = (config) => {
  /**
   * Send an email verification email
   * @param {Object} user - User object
   * @param {string} token - Verification token
   * @returns {Promise<Object>} - Email send result
   */
  const sendVerification = async (user, token) => {
    if (!user || !token) {
      throw new Error('User and token are required');
    }
    
    return await sendVerificationEmail(config, user, token);
  };
  
  /**
   * Send a password reset email
   * @param {Object} user - User object
   * @param {string} token - Password reset token
   * @returns {Promise<Object>} - Email send result
   */
  const sendPasswordReset = async (user, token) => {
    if (!user || !token) {
      throw new Error('User and token are required');
    }
    
    return await sendPasswordResetEmail(config, user, token);
  };
  
  /**
   * Send a welcome email
   * @param {Object} user - User object
   * @returns {Promise<Object>} - Email send result
   */
  const sendWelcome = async (user) => {
    if (!user) {
      throw new Error('User is required');
    }
    
    return await sendWelcomeEmail(config, user);
  };
  
  /**
   * Test email configuration
   * @returns {Promise<boolean>} - Test result
   */
  const testEmailConfiguration = async () => {
    try {
      // In development with no email config, use Ethereal
      const isLocalSMTPAttempt = 
        config.emailOptions.transport.host === '127.0.0.1' || 
        config.emailOptions.transport.host === 'localhost';
      
      const noEmailConfig = 
        !config.emailOptions.transport.host || 
        !config.emailOptions.transport.auth.user ||
        isLocalSMTPAttempt;
      
      const devEnvironment = process.env.NODE_ENV !== 'production';
      
      if (devEnvironment && noEmailConfig) {
        // Create test account with Ethereal
        const testAccount = await nodemailer.createTestAccount();
        console.log('Ethereal Test Account Created:');
        console.log('- User:', testAccount.user);
        console.log('- Password:', testAccount.pass);
        console.log('- Host:', testAccount.smtp.host);
        return true;
      }
      
      // Create regular transport with the provided configuration
      const transport = nodemailer.createTransport(config.emailOptions.transport);
      
      // Verify the connection
      await transport.verify();
      
      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  };
  
  return {
    sendVerification,
    sendPasswordReset,
    sendWelcome,
    testEmailConfiguration
  };
}; 