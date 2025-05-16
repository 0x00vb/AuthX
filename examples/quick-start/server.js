/**
 * AuthX Quick Start Example
 */
require('dotenv').config();
const { quickSetup, roles } = require('../../src');

// Initialize AuthX with all defaults
const { app, protect, requireRole } = quickSetup({
  // All configuration is optional with sensible defaults
  // accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  // refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  // useEmailVerification: true,
  // useCookies: true
});

// Public route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AuthX Quick Start Example',
    endpoints: {
      public: '/',
      protected: '/protected',
      adminOnly: '/admin',
      moderatorOrAdmin: '/mod-admin'
    }
  });
});

// Protected route - requires authentication
app.get('/protected', protect, (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: req.user
  });
});

// Admin-only route
app.get('/admin', requireRole(roles.ROLES.ADMIN), (req, res) => {
  res.json({
    message: 'Admin-only content',
    user: req.user
  });
});

// Moderator or admin route
app.get('/mod-admin', requireRole([roles.ROLES.MODERATOR, roles.ROLES.ADMIN]), (req, res) => {
  res.json({
    message: 'Moderator or admin content',
    user: req.user
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
}); 