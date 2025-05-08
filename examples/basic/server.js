/**
 * Basic Express Auth Toolkit Example
 * 
 * This example demonstrates how to use the Express Auth Toolkit
 * with a memory adapter for quick prototyping and development.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
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

// Initialize the auth toolkit
const authToolkit = new AuthX({
  jwtOptions: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d'
  },
  useRefreshTokens: true,
  useSessionCookies: true,
  enable2FA: true,
  enableEmailVerification: false, // Disable for this example
  enablePasswordReset: true,
  baseUrl: '/api/auth'
});

// Register auth routes
authToolkit.init(app);

// Get middleware references for securing routes
const { requireAuth, requireRole, validate2FA } = authToolkit.getMiddlewares();

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

// Admin route (requires authentication + admin role)
app.get('/api/admin', requireAuth(), requireRole('admin'), (req, res) => {
  res.json({ 
    message: 'This is an admin endpoint',
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Auth routes available at: http://localhost:${PORT}${authToolkit.config.baseUrl}`);
  console.log(`Test protected route at: http://localhost:${PORT}/api/protected`);
});

// Log available routes for testing
console.log('\nAvailable auth routes:');
console.log(`- POST ${authToolkit.config.baseUrl}/register`);
console.log(`- POST ${authToolkit.config.baseUrl}/login`);
console.log(`- POST ${authToolkit.config.baseUrl}/refresh-token`);
console.log(`- POST ${authToolkit.config.baseUrl}/logout`);
console.log(`- POST ${authToolkit.config.baseUrl}/forgot-password`);
console.log(`- POST ${authToolkit.config.baseUrl}/reset-password/:token`);
console.log(`- POST ${authToolkit.config.baseUrl}/2fa/setup`);
console.log(`- POST ${authToolkit.config.baseUrl}/2fa/verify`);
console.log(`- GET ${authToolkit.config.baseUrl}/2fa/recovery-codes`); 