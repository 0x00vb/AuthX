/**
 * Email utilities for sending authentication-related emails
 */
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { renderTemplate } = require('./template');

/**
 * Create a test account with Ethereal for development
 * @returns {Promise<Object>} - Test account and transport
 */
const createTestAccount = async () => {
  try {
    // Create a test account with Ethereal
    console.log('Creating Ethereal test email account...');
    const testAccount = await nodemailer.createTestAccount();
    
    // Log the test account credentials for reference
    console.log('Ethereal Email Test Account Created:');
    console.log('- Email:', testAccount.user);
    console.log('- Password:', testAccount.pass);
    console.log('- SMTP Host:', testAccount.smtp.host);
    
    // Create a test transport
    const transport = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    return { testAccount, transport };
  } catch (error) {
    console.error('Failed to create test account:', error);
    throw error;
  }
};

/**
 * Create a nodemailer transport
 * @param {Object} config - Email configuration
 * @returns {Promise<Object>} - Nodemailer transport
 */
const createTransport = async (config) => {
  // Check if we're in development mode with no email configuration
  const isLocalSMTPAttempt = 
    config.emailOptions.transport.host === '127.0.0.1' || 
    config.emailOptions.transport.host === 'localhost';
  
  const noEmailConfig = 
    !config.emailOptions.transport.host || 
    !config.emailOptions.transport.auth.user ||
    isLocalSMTPAttempt;
  
  const devEnvironment = process.env.NODE_ENV !== 'production';
  
  // Use Ethereal for development if email not configured
  if (devEnvironment && noEmailConfig) {
    const { transport } = await createTestAccount();
    return transport;
  }
  
  // Use configured transport
  return nodemailer.createTransport(config.emailOptions.transport);
};

/**
 * Generate an email verification token
 * @returns {string} - UUID v4 token
 */
const generateVerificationToken = () => {
  return uuidv4();
};

/**
 * Generate a password reset token
 * @returns {string} - UUID v4 token
 */
const generatePasswordResetToken = () => {
  return uuidv4();
};

/**
 * Send an email verification email
 * @param {Object} config - Email configuration
 * @param {Object} user - User object
 * @param {string} token - Verification token
 * @returns {Promise<Object>} - Nodemailer send result
 */
const sendVerificationEmail = async (config, user, token) => {
  const transport = await createTransport(config);
  const verificationUrl = `${config.emailOptions.verificationUrl}?token=${token}`;
  
  // Render email template
  const html = await renderTemplate(
    config.emailOptions.templates.verifyEmail,
    {
      name: user.name || user.email.split('@')[0],
      email: user.email,
      verificationUrl
    }
  );
  
  const mailOptions = {
    from: config.emailOptions.from,
    to: user.email,
    subject: 'Verify Your Email Address',
    html
  };
  
  const info = await transport.sendMail(mailOptions);
  
  // Log Ethereal preview URL if available
  if (info.ethereal) {
    console.log('Verification Email Preview URL:', nodemailer.getTestMessageUrl(info));
  }
  
  return info;
};

/**
 * Send a password reset email
 * @param {Object} config - Email configuration
 * @param {Object} user - User object
 * @param {string} token - Password reset token
 * @returns {Promise<Object>} - Nodemailer send result
 */
const sendPasswordResetEmail = async (config, user, token) => {
  const transport = await createTransport(config);
  const resetUrl = `${config.emailOptions.passwordResetUrl}?token=${token}`;
  
  // Render email template
  const html = await renderTemplate(
    config.emailOptions.templates.resetPassword,
    {
      name: user.name || user.email.split('@')[0],
      email: user.email,
      resetUrl
    }
  );
  
  const mailOptions = {
    from: config.emailOptions.from,
    to: user.email,
    subject: 'Reset Your Password',
    html
  };
  
  const info = await transport.sendMail(mailOptions);
  
  // Log Ethereal preview URL if available
  if (info.ethereal) {
    console.log('Password Reset Email Preview URL:', nodemailer.getTestMessageUrl(info));
  }
  
  return info;
};

/**
 * Send a welcome email
 * @param {Object} config - Email configuration
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Nodemailer send result
 */
const sendWelcomeEmail = async (config, user) => {
  const transport = await createTransport(config);
  
  const mailOptions = {
    from: config.emailOptions.from,
    to: user.email,
    subject: 'Welcome to Our Service',
    html: `
      <h1>Welcome!</h1>
      <p>Hello${user.name ? ` ${user.name}` : ''},</p>
      <p>Thank you for registering with our service.</p>
      <p>Your account has been created successfully.</p>
      <p>We're excited to have you on board!</p>
    `
  };
  
  const info = await transport.sendMail(mailOptions);
  
  // Log Ethereal preview URL if available
  if (info.ethereal) {
    console.log('Welcome Email Preview URL:', nodemailer.getTestMessageUrl(info));
  }
  
  return info;
};

module.exports = {
  generateVerificationToken,
  generatePasswordResetToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
}; 