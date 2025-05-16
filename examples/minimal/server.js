/**
 * AuthX Minimal Example
 * 
 * This example shows how to set up AuthX with just a few lines of code
 */
require('dotenv').config();
const { quickSetup, roles } = require('../../src');

// Setup AuthX with a single line
const { app, protect, requireRole } = quickSetup();

// Public route (no auth required)
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AuthX!',
    routes: {
      '/': 'Public - No authentication required',
      '/me': 'Protected - Any authenticated user',
      '/admin': 'Admin - Only users with admin role',
      '/staff': 'Staff - Users with admin OR moderator role'
    },
    api: {
      '/api/auth/register': 'Register a new user',
      '/api/auth/login': 'Login with email and password',
      '/api/users/me': 'Get current user profile'
    }
  });
});

// Protected route - any authenticated user can access
app.get('/me', protect, (req, res) => {
  res.json({
    message: 'You are authenticated!',
    user: req.user
  });
});

// Admin-only route
app.get('/admin', requireRole(roles.ROLES.ADMIN), (req, res) => {
  res.json({
    message: 'Admin area',
    user: req.user
  });
});

// Route accessible to users with either admin OR moderator role
app.get('/staff', requireRole([roles.ROLES.ADMIN, roles.ROLES.MODERATOR]), (req, res) => {
  res.json({
    message: 'Staff area',
    user: req.user
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  🔐 AuthX Minimal Example Running
  
  📡 Server: http://localhost:${PORT}
  
  🔑 To get started:
     1. Create a user: POST http://localhost:${PORT}/api/auth/register
     2. Login: POST http://localhost:${PORT}/api/auth/login
     3. Access protected route: GET http://localhost:${PORT}/me
  
  👮 Role management:
     - Default user role is 'user'
     - To access admin area, you need the 'admin' role
     - For role management, check the roles utility in AuthX
  `);
}); 