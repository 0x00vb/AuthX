/**
 * AuthX Test Server
 * 
 * This file sets up a test server instance for API testing.
 * It configures AuthX with the memory adapter and mock email service.
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const AuthX = require('./src');
const memoryAdapter = require('./src/adapters/memory');
const app = express();

// Enable debug mode from environment
const DEBUG = process.env.DEBUG === 'true';
const debugLog = (...args) => {
  if (DEBUG) console.log('[TEST-SERVER]', ...args);
};

// Mock email service to capture emails for testing
const mockEmails = [];
const mockEmailService = {
  sendMail: async (mailOptions) => {
    debugLog('Email sent:', mailOptions.subject);
    // Add timestamp to help with sorting/retrieval
    const emailWithTimestamp = {
      ...mailOptions,
      timestamp: Date.now(),
      time: new Date().toISOString()
    };
    mockEmails.push(emailWithTimestamp);
    return { 
      messageId: `mock-${Date.now()}`,
      envelope: mailOptions.envelope || {
        from: mailOptions.from,
        to: mailOptions.to
      }
    };
  }
};

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure trust proxy for testing
app.set('trust proxy', 'loopback');

// Initialize AuthX
const authx = new AuthX({
  jwtOptions: {
    secret: 'test-secret-key', // Fixed secret for predictable tests
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d'
  },
  emailOptions: {
    from: 'test@example.com',
    transport: mockEmailService, // Use our mock email service
    verificationUrl: 'http://localhost:3001/auth/verify-email',
    passwordResetUrl: 'http://localhost:3001/auth/reset-password'
  },
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },
  adapter: memoryAdapter({
    // Add any adapter configuration options here
    debug: DEBUG
  }),
  baseUrl: '/api/auth',
  useRefreshTokens: true,
  useSessionCookies: true,
  requireEmailVerification: false, // Set to false for initial tests
  enablePasswordReset: true,
  enable2FA: true,
  cookieOptions: {
    secure: false,
    sameSite: 'lax'
  }
});

// Initialize AuthX with app
authx.init(app);

// Log registered routes if in debug mode
if (DEBUG) {
  debugLog('Registered routes:');
  const printRoutes = (stack, basePath = '') => {
    stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods)
          .filter(method => layer.route.methods[method])
          .join(',');
        debugLog(`${methods.toUpperCase()} ${basePath}${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle.stack) {
        let path = layer.regexp.toString()
          .replace('/^\\', '')
          .replace('\\/?(?=\\/|$)/i', '')
          .replace(/\\\//g, '/');
        if (path === '/') path = '';
        printRoutes(layer.handle.stack, basePath + path);
      }
    });
  };
  
  if (app._router && app._router.stack) {
    printRoutes(app._router.stack);
  }
}

// Add route to retrieve mock emails for testing purposes
app.get('/test/emails', (req, res) => {
  debugLog(`Returning ${mockEmails.length} captured emails`);
  res.json(mockEmails);
});

// Add route to clear mock emails for clean testing
app.post('/test/emails/clear', (req, res) => {
  const count = mockEmails.length;
  mockEmails.length = 0;
  debugLog(`Cleared ${count} emails`);
  res.json({ message: 'Mock emails cleared', count });
});

// Get specific email by index
app.get('/test/emails/:index', (req, res) => {
  const index = parseInt(req.params.index, 10);
  if (isNaN(index) || index < 0 || index >= mockEmails.length) {
    return res.status(404).json({ error: 'Email not found' });
  }
  debugLog(`Returning email at index ${index}`);
  res.json(mockEmails[index]);
});

// Utility API to retrieve stored verification tokens for testing
app.get('/test/verification-tokens/:email', async (req, res) => {
  try {
    debugLog(`Retrieving verification tokens for ${req.params.email}`);
    const email = req.params.email;
    const adapter = authx.config.adapter;
    
    // Get all verification tokens (adapter implementation specific)
    const tokens = await adapter.getEmailVerificationTokensByEmail(email);
    debugLog(`Found ${tokens ? tokens.length : 0} verification tokens`);
    res.json(tokens || []);
  } catch (error) {
    console.error('Error retrieving verification tokens:', error);
    res.status(500).json({ error: error.message });
  }
});

// Utility API to retrieve stored password reset tokens for testing
app.get('/test/password-reset-tokens/:email', async (req, res) => {
  try {
    debugLog(`Retrieving password reset tokens for ${req.params.email}`);
    const email = req.params.email;
    const adapter = authx.config.adapter;
    
    // Get all password reset tokens (adapter implementation specific)
    const tokens = await adapter.getPasswordResetTokensByEmail(email);
    debugLog(`Found ${tokens ? tokens.length : 0} reset tokens`);
    res.json(tokens || []);
  } catch (error) {
    console.error('Error retrieving password reset tokens:', error);
    res.status(500).json({ error: error.message });
  }
});

// Utility to manually verify a user (for testing without email verification)
app.post('/test/verify-user/:email', async (req, res) => {
  try {
    debugLog(`Manually verifying user ${req.params.email}`);
    const email = req.params.email;
    const adapter = authx.config.adapter;
    
    // Find user by email
    const user = await adapter.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update isVerified flag
    await adapter.updateUser(user.id, { isVerified: true });
    debugLog(`User ${email} has been manually verified`);
    
    res.json({ message: 'User verified successfully', userId: user.id });
  } catch (error) {
    console.error('Error manually verifying user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export the app for testing
module.exports = app; 