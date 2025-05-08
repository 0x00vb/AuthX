/**
 * Minimal Google OAuth Example
 * 
 * This example shows the minimal configuration needed for Google OAuth.
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const { auth } = require('express-auth-toolkit');

// Create Express app
const app = express();

// Configure OAuth settings
const authConfig = {
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: '/auth/oauth/google/callback',
      successRedirect: '/profile',
      failureRedirect: '/login'
    }
  },
  enableOAuth: true
};

// Initialize auth middleware and routes
const { router, middlewares } = auth(authConfig);

// Mount authentication routes
app.use('/auth', router);

// Home page
app.get('/', (req, res) => {
  res.send(`
    <h1>Google OAuth Example</h1>
    <p>Click below to login with Google:</p>
    <a href="/auth/oauth/google">Login with Google</a>
  `);
});

// Profile page (protected route)
app.get('/profile', middlewares.requireAuth(), (req, res) => {
  res.send(`
    <h1>Profile</h1>
    <p>Hello, ${req.user.email || req.user.displayName || 'User'}!</p>
    <p>User ID: ${req.user.id}</p>
    <p><a href="/logout">Logout</a></p>
  `);
});

// Login page
app.get('/login', (req, res) => {
  res.send(`
    <h1>Login</h1>
    <p>Authentication failed. Please try again.</p>
    <a href="/auth/oauth/google">Login with Google</a>
  `);
});

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.redirect('/');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 