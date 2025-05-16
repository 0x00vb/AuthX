/**
 * Email Service
 */
const nodemailer = require('nodemailer');

class EmailService {
  constructor(options = {}) {
    this.transport = options.transport || null;
    this.config = options.config || {};
    
    // Set up default transport if not provided
    if (!this.transport && process.env.NODE_ENV !== 'test') {
      this.transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }
  }

  /**
   * Send an email
   * @param {Object} emailOptions - Email options
   * @returns {Object} Result of sending email
   */
  async sendEmail(emailOptions) {
    try {
      if (!this.transport) {
        throw new Error('Email transport not configured');
      }
      
      const mailOptions = {
        from: emailOptions.from || this.config.email.from,
        to: emailOptions.to,
        subject: emailOptions.subject,
        text: emailOptions.text,
        html: emailOptions.html,
      };
      
      return await this.transport.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send a verification email
   * @param {String} to - Recipient email
   * @param {String} token - Verification token
   * @returns {Object} Result of sending email
   */
  async sendVerificationEmail(to, token) {
    const verificationUrl = `${this.config.email.verificationUrl}?token=${token}`;
    
    return this.sendEmail({
      to,
      subject: 'Email Verification',
      text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Thank you for signing up! Please verify your email by clicking the button below:</p>
          <div style="margin: 20px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
          </div>
          <p>Or copy and paste the following link into your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    });
  }

  /**
   * Send a password reset email
   * @param {String} to - Recipient email
   * @param {String} token - Reset token
   * @returns {Object} Result of sending email
   */
  async sendPasswordResetEmail(to, token) {
    const resetUrl = `${this.config.email.resetPasswordUrl}?token=${token}`;
    
    return this.sendEmail({
      to,
      subject: 'Password Reset',
      text: `You requested a password reset. Please click on the following link to reset your password: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>You requested a password reset. Please click the button below to create a new password:</p>
          <div style="margin: 20px 0;">
            <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          </div>
          <p>Or copy and paste the following link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can ignore this email.</p>
        </div>
      `,
    });
  }
}

module.exports = EmailService;