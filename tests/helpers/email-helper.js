/**
 * Email Testing Helper
 * 
 * This helper provides utilities for testing email verification flows
 * by intercepting emails and extracting verification tokens.
 */

const request = require('supertest');

class EmailHelper {
  constructor(app) {
    this.app = app;
    this.debugMode = process.env.DEBUG === 'true';
  }

  /**
   * Log debug information if debug mode is enabled
   */
  debug(...args) {
    if (this.debugMode) {
      console.log('[EMAIL-HELPER]', ...args);
    }
  }

  /**
   * Clear all captured emails from the mock email service
   * @returns {Promise<void>}
   */
  async clearEmails() {
    try {
      await request(this.app)
        .post('/test/emails/clear')
        .expect(200);
      this.debug('Cleared all emails');
    } catch (err) {
      console.error('Failed to clear emails:', err.message);
    }
  }

  /**
   * Get all emails sent by the application
   * @returns {Promise<Array>} - Array of email objects
   */
  async getEmails() {
    try {
      const response = await request(this.app)
        .get('/test/emails')
        .expect(200);
      
      this.debug(`Retrieved ${response.body.length} emails`);
      return response.body || [];
    } catch (err) {
      console.error('Failed to get emails:', err.message);
      return [];
    }
  }

  /**
   * Get the latest email sent to a specific email address
   * @param {string} toEmail - The recipient email to filter by
   * @returns {Promise<Object|null>} - The email object or null if not found
   */
  async getLatestEmailTo(toEmail) {
    const emails = await this.getEmails();
    this.debug(`Looking for email to: ${toEmail} in ${emails.length} emails`);
    
    if (emails.length === 0) {
      this.debug('No emails available');
      return null;
    }
    
    // Dump all emails for debugging
    if (this.debugMode) {
      emails.forEach((email, i) => {
        const to = email.to ? (typeof email.to === 'string' ? email.to : JSON.stringify(email.to)) : 'undefined';
        this.debug(`Email[${i}] To: ${to}, Subject: ${email.subject || 'none'}`);
      });
    }
    
    // Filter and sort emails by timestamp (newest first)
    const filteredEmails = emails
      .filter(email => {
        if (!email) return false;
        
        // Check if to field contains the target email
        let to = email.to;
        if (!to) {
          // Try to find to in envelope or other fields
          to = email.envelope?.to || email.envelope?.rcptTo || [];
        }
        
        // Normalize to array
        to = Array.isArray(to) ? to : [to];
        
        const matches = to.some(recipient => {
          if (!recipient) return false;
          if (typeof recipient === 'string') {
            return recipient.includes(toEmail);
          }
          return recipient.address && recipient.address.includes(toEmail);
        });
        
        if (matches) {
          this.debug(`Found matching email to ${toEmail}`);
        }
        return matches;
      })
      .sort((a, b) => {
        const dateA = a.timestamp || a.date || a.time || 0;
        const dateB = b.timestamp || b.date || b.time || 0;
        return dateB - dateA;
      });
    
    if (filteredEmails.length === 0) {
      this.debug(`No emails found for ${toEmail}`);
      return null;
    }
    
    this.debug(`Found ${filteredEmails.length} emails for ${toEmail}, using most recent`);
    return filteredEmails[0];
  }

  /**
   * Extract verification token from an email
   * @param {string} emailContent - The HTML or text content of the email
   * @returns {string|null} - The extracted token or null if not found
   */
  extractVerificationToken(emailContent) {
    if (!emailContent) {
      this.debug('No email content provided to extract verification token');
      return null;
    }
    
    this.debug('Extracting verification token from email content');
    
    // Common patterns for verification links
    const patterns = [
      /verify-email\?token=([^&"\s]+)/i,  // Most common format
      /token=([^&"\s]+)/i,                // Generic token parameter
      /\/auth\/verify\/([^\/"\s]+)/i,     // URL path format
      /\/verify-email\/([^\/"\s]+)/i      // Another common format
    ];
    
    for (const pattern of patterns) {
      const match = emailContent.match(pattern);
      if (match && match[1]) {
        this.debug(`Extracted verification token: ${match[1].substring(0, 8)}...`);
        return match[1];
      }
    }
    
    this.debug('No verification token found in email content');
    return null;
  }

  /**
   * Extract password reset token from an email
   * @param {string} emailContent - The HTML or text content of the email
   * @returns {string|null} - The extracted token or null if not found
   */
  extractPasswordResetToken(emailContent) {
    if (!emailContent) {
      this.debug('No email content provided to extract reset token');
      return null;
    }
    
    this.debug('Extracting password reset token from email content');
    
    // Common patterns for reset password links
    const patterns = [
      /reset-password\?token=([^&"\s]+)/i,  // Most common format
      /reset\?token=([^&"\s]+)/i,           // Shorter variant
      /\/auth\/reset\/([^\/"\s]+)/i,        // URL path format
      /\/reset-password\/([^\/"\s]+)/i      // Another common format
    ];
    
    for (const pattern of patterns) {
      const match = emailContent.match(pattern);
      if (match && match[1]) {
        this.debug(`Extracted reset token: ${match[1].substring(0, 8)}...`);
        return match[1];
      }
    }
    
    this.debug('No reset token found in email content');
    return null;
  }

  /**
   * Get verification token for a user from the latest email
   * @param {string} email - The user's email address
   * @returns {Promise<string|null>} - The verification token or null if not found
   */
  async getVerificationToken(email) {
    this.debug(`Getting verification token for email: ${email}`);
    const latestEmail = await this.getLatestEmailTo(email);
    if (!latestEmail) {
      this.debug('No email found');
      return null;
    }
    
    // Check both HTML and text content
    const content = latestEmail.html || latestEmail.text || latestEmail.textContent || latestEmail.content || '';
    this.debug(`Email content length: ${content.length} characters`);
    const token = this.extractVerificationToken(content);
    
    // If no token from content, try to extract from raw message if available
    if (!token && latestEmail.raw) {
      this.debug('Trying to extract token from raw email');
      return this.extractVerificationToken(latestEmail.raw);
    }
    
    return token;
  }

  /**
   * Get password reset token for a user from the latest email
   * @param {string} email - The user's email address
   * @returns {Promise<string|null>} - The password reset token or null if not found
   */
  async getPasswordResetToken(email) {
    this.debug(`Getting password reset token for email: ${email}`);
    const latestEmail = await this.getLatestEmailTo(email);
    if (!latestEmail) {
      this.debug('No email found');
      return null;
    }
    
    // Check both HTML and text content
    const content = latestEmail.html || latestEmail.text || latestEmail.textContent || latestEmail.content || '';
    this.debug(`Email content length: ${content.length} characters`);
    const token = this.extractPasswordResetToken(content);
    
    // If no token from content, try to extract from raw message if available
    if (!token && latestEmail.raw) {
      this.debug('Trying to extract token from raw email');
      return this.extractPasswordResetToken(latestEmail.raw);
    }
    
    return token;
  }

  /**
   * Get verification token directly from the database
   * This is a fallback when email extraction doesn't work
   * @param {string} email - The user's email
   * @returns {Promise<string|null>} - The verification token or null
   */
  async getVerificationTokenFromDB(email) {
    try {
      this.debug(`Getting verification token from DB for: ${email}`);
      const response = await request(this.app)
        .get(`/test/verification-tokens/${email}`)
        .expect(200);
      
      if (response.body && response.body.length > 0) {
        // Return the most recent token
        const token = response.body[0].token;
        this.debug(`Retrieved token from DB: ${token ? (token.substring(0, 8) + '...') : 'none'}`);
        return token;
      }
      this.debug('No verification tokens found in DB');
      return null;
    } catch (error) {
      console.error('Failed to get verification token from DB:', error.message);
      return null;
    }
  }

  /**
   * Get password reset token directly from the database
   * This is a fallback when email extraction doesn't work
   * @param {string} email - The user's email
   * @returns {Promise<string|null>} - The password reset token or null
   */
  async getPasswordResetTokenFromDB(email) {
    try {
      this.debug(`Getting password reset token from DB for: ${email}`);
      const response = await request(this.app)
        .get(`/test/password-reset-tokens/${email}`)
        .expect(200);
      
      if (response.body && response.body.length > 0) {
        // Return the most recent token
        const token = response.body[0].token;
        this.debug(`Retrieved token from DB: ${token ? (token.substring(0, 8) + '...') : 'none'}`);
        return token;
      }
      this.debug('No password reset tokens found in DB');
      return null;
    } catch (error) {
      console.error('Failed to get password reset token from DB:', error.message);
      return null;
    }
  }
}

module.exports = EmailHelper; 