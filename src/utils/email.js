/**
 * Email utilities for sending authentication-related emails
 */
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { renderTemplate } = require('./template');

/**
 * Create a nodemailer transport
 * @param {Object} config - Email configuration
 * @returns {Object} - Nodemailer transport
 */
const createTransport = (config) => {
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
  const transport = createTransport(config);
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
  
  return await transport.sendMail(mailOptions);
};

/**
 * Send a password reset email
 * @param {Object} config - Email configuration
 * @param {Object} user - User object
 * @param {string} token - Password reset token
 * @returns {Promise<Object>} - Nodemailer send result
 */
const sendPasswordResetEmail = async (config, user, token) => {
  const transport = createTransport(config);
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
  
  return await transport.sendMail(mailOptions);
};

/**
 * Send a welcome email
 * @param {Object} config - Email configuration
 * @param {Object} user - User object
 * @returns {Promise<Object>} - Nodemailer send result
 */
const sendWelcomeEmail = async (config, user) => {
  const transport = createTransport(config);
  
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
  
  return await transport.sendMail(mailOptions);
};

module.exports = {
  generateVerificationToken,
  generatePasswordResetToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
}; 