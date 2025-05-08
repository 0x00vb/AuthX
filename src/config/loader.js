/**
 * Configuration loader for Express Auth Toolkit
 * Merges user-provided options with sensible defaults
 */

const path = require('path');
const { v4: uuidv4 } = require('uuid');
const memoryAdapter = require('../adapters/memory');

/**
 * Default configuration values
 */
const defaultConfig = {
  jwtOptions: {
    secret: process.env.JWT_SECRET || uuidv4(),
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
    issuer: 'express-auth-toolkit',
    audience: 'api:users',
  },
  
  emailOptions: {
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    transport: {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    },
    templates: {
      verifyEmail: path.join(__dirname, '../templates/verify-email.html'),
      resetPassword: path.join(__dirname, '../templates/reset-password.html'),
    },
    verificationUrl: process.env.EMAIL_VERIFICATION_URL || '/auth/verify-email',
    passwordResetUrl: process.env.PASSWORD_RESET_URL || '/auth/reset-password',
  },
  
  rateLimitOptions: {
    loginWindow: 15 * 60 * 1000, // 15 minutes
    loginMax: 5, // 5 attempts
    registrationWindow: 60 * 60 * 1000, // 1 hour
    registrationMax: 3, // 3 attempts
    passwordResetWindow: 60 * 60 * 1000, // 1 hour
    passwordResetMax: 3, // 3 attempts
  },
  
  oauthOptions: {
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/oauth/google/callback',
      scope: ['profile', 'email'],
    },
    github: {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || '/auth/oauth/github/callback',
      scope: ['user:email'],
    },
  },
  
  twoFactorOptions: {
    issuer: process.env.APP_NAME || 'Express Auth Toolkit',
    recoveryCodeCount: 10,
    recoveryCodeLength: 10,
    windowMs: 30000, // 30 seconds time window for TOTP
  },
  
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  
  // Feature flags
  useRefreshTokens: true,
  useSessionCookies: false,
  enable2FA: false,
  enableEmailVerification: true,
  enablePasswordReset: true,
  enableOAuth: false,
  
  // Base URL for auth routes
  baseUrl: '/auth',
  
  // Default adapter is memory (for easy setup)
  adapter: null,
};

/**
 * Deep merge two objects
 * @param {Object} target - The target object
 * @param {Object} source - The source object
 * @returns {Object} - Merged object
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  if (typeof source !== 'object' || source === null) {
    return output;
  }
  
  Object.keys(source).forEach(key => {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  });
  
  return output;
}

/**
 * Load and merge configuration
 * @param {Object} userConfig - User-provided configuration
 * @returns {Object} - Merged configuration
 */
function configLoader(userConfig = {}) {
  const config = deepMerge(defaultConfig, userConfig);
  
  // If no adapter is provided, use the memory adapter
  if (!config.adapter) {
    config.adapter = memoryAdapter();
  }
  
  // Validate required configuration
  if (!config.jwtOptions.secret) {
    console.warn('WARNING: JWT secret not provided. Using a random UUID which will change on restart.');
    config.jwtOptions.secret = uuidv4();
  }
  
  // If email features are enabled but no transport is configured, warn the user
  if ((config.enableEmailVerification || config.enablePasswordReset) && 
      (!config.emailOptions.transport.host || !config.emailOptions.transport.auth.user)) {
    console.warn('WARNING: Email features enabled but no email transport configured.');
  }
  
  // If OAuth is enabled but no clients are configured, warn the user
  if (config.enableOAuth) {
    const googleConfigured = config.oauthOptions.google.clientID && config.oauthOptions.google.clientSecret;
    const githubConfigured = config.oauthOptions.github.clientID && config.oauthOptions.github.clientSecret;
    
    if (!googleConfigured && !githubConfigured) {
      console.warn('WARNING: OAuth enabled but no providers configured.');
    }
  }
  
  return config;
}

module.exports = configLoader; 