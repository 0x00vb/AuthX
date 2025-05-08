/**
 * Two-Factor Authentication Example for Express Auth Toolkit
 * 
 * This example demonstrates how to use the Two-Factor Authentication
 * feature of Express Auth Toolkit.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const AuthX = require('../../src'); // In real usage: require('express-auth-toolkit')

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize the auth toolkit with 2FA enabled
const authToolkit = new AuthX({
  jwtOptions: {
    secret: process.env.JWT_SECRET || '2fa-example-secret-change-in-production',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d'
  },
  // Memory adapter is fine for this example
  useRefreshTokens: true,
  useSessionCookies: true,
  
  // Enable 2FA
  enable2FA: true,
  
  // 2FA options
  twoFactorOptions: {
    issuer: 'Express Auth Toolkit 2FA Example',
    recoveryCodeCount: 8,
    recoveryCodeLength: 10
  },
  
  baseUrl: '/api/auth'
});

// Register auth routes
authToolkit.init(app);

// Get middleware references
const { requireAuth, validate2FA } = authToolkit.getMiddlewares();
const { twoFactorAuth } = authToolkit.getServices();

// Public route
app.get('/api/public', (req, res) => {
  res.json({ message: 'This is a public endpoint' });
});

// Protected route (requires authentication)
app.get('/api/protected', requireAuth(), (req, res) => {
  res.json({ 
    message: 'This is a protected endpoint',
    user: req.user
  });
});

// 2FA-protected route (requires authentication + 2FA verification)
app.get('/api/sensitive', requireAuth(), validate2FA(), (req, res) => {
  res.json({ 
    message: 'This is a sensitive endpoint protected by 2FA',
    user: req.user
  });
});

// Get 2FA status for a user
app.get('/api/2fa-status', requireAuth(), async (req, res) => {
  try {
    const enabled = await twoFactorAuth.isEnabled(req.user.id);
    res.json({ enabled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Auth routes available at: http://localhost:${PORT}${authToolkit.config.baseUrl}`);
  console.log(`2FA setup available at: http://localhost:${PORT}/2fa-setup.html`);
});

// Log available routes for testing
console.log('\nAvailable auth and 2FA routes:');
console.log(`- POST ${authToolkit.config.baseUrl}/register`);
console.log(`- POST ${authToolkit.config.baseUrl}/login`);
console.log(`- GET ${authToolkit.config.baseUrl}/2fa/status`);
console.log(`- POST ${authToolkit.config.baseUrl}/2fa/generate`);
console.log(`- POST ${authToolkit.config.baseUrl}/2fa/enable`);
console.log(`- POST ${authToolkit.config.baseUrl}/2fa/verify`);
console.log(`- POST ${authToolkit.config.baseUrl}/2fa/disable`);
console.log(`- GET ${authToolkit.config.baseUrl}/2fa/recovery-codes`);
console.log(`- POST ${authToolkit.config.baseUrl}/2fa/generate-recovery-codes`); 