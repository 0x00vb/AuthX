/**
 * AuthX Configuration
 */
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

class AuthX {
  constructor(options = {}) {
    // Database adapter
    this.dbAdapter = options.dbAdapter;
    
    // JWT configuration
    this.jwt = {
      accessTokenSecret: options.accessTokenSecret || process.env.ACCESS_TOKEN_SECRET,
      refreshTokenSecret: options.refreshTokenSecret || process.env.REFRESH_TOKEN_SECRET,
      accessTokenExpiry: options.accessTokenExpiry || process.env.ACCESS_TOKEN_EXPIRY || '15m',
      refreshTokenExpiry: options.refreshTokenExpiry || process.env.REFRESH_TOKEN_EXPIRY || '7d',
    };

    // Authentication options
    this.auth = {
      useCookies: options.useCookies || process.env.USE_COOKIES === 'true' || false,
      useRefreshToken: options.useRefreshToken !== false,
      useEmailVerification: options.useEmailVerification || process.env.USE_EMAIL_VERIFICATION === 'true' || false,
      use2FA: options.use2FA || process.env.USE_2FA === 'true' || false,
    };

    // Security options
    this.security = {
      bcryptSaltRounds: options.bcryptSaltRounds || parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
      rateLimit: {
        windowMs: options.rateLimitWindowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15 * 60 * 1000', 10),
        max: options.rateLimitMax || parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    };

    // Email settings
    this.email = {
      transport: options.emailTransport || null,
      from: options.emailFrom || process.env.EMAIL_FROM || 'no-reply@example.com',
      verificationUrl: options.verificationUrl || process.env.VERIFICATION_URL || 'http://localhost:3000/verify',
      resetPasswordUrl: options.resetPasswordUrl || process.env.RESET_PASSWORD_URL || 'http://localhost:3000/reset-password',
    };
  }

  /**
   * Initialize AuthX with the express app
   * @param {Object} app - Express app instance
   */
  init(app) {
    if (!app) {
      throw new Error('Express app instance is required');
    }

    if (!this.dbAdapter) {
      throw new Error('Database adapter is required');
    }

    // Initialize the database adapter
    this.dbAdapter.connect();

    return app;
  }
}

module.exports = AuthX; 