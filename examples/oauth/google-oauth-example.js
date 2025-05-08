/**
 * Google OAuth Example
 * 
 * This file demonstrates how to set up Google OAuth authentication
 * using Express Auth Toolkit.
 */

require('dotenv').config();
const express = require('express');
const { AuthToolkit } = require('express-auth-toolkit');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Set up view engine (for the demo UI)
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure the Auth Toolkit
const authToolkit = new AuthToolkit({
  // JWT configuration
  jwtOptions: {
    secret: process.env.JWT_SECRET,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  
  // Enable OAuth
  enableOAuth: true,
  
  // OAuth configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || '/auth/oauth/google/callback',
      // URLs for redirects after authentication
      successRedirect: '/profile',
      failureRedirect: '/login',
      // Scopes to request from Google
      scope: ['profile', 'email']
    }
  },
  
  // Cookie configuration for storing refresh tokens
  useSessionCookies: true,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
});

// Initialize authentication routes and middleware
const { router, middlewares } = authToolkit.init();

// Mount auth routes
app.use('/auth', router);

// Create home page
app.get('/', (req, res) => {
  res.render('home', {
    title: 'Google OAuth Example'
  });
});

// Login page
app.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login with Google',
    error: req.query.error
  });
});

// Profile page (protected)
app.get('/profile', 
  middlewares.requireAuth(),
  (req, res) => {
    res.render('profile', {
      title: 'User Profile',
      user: req.user
    });
  }
);

// Logout route
app.get('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.redirect('/');
});

// Start the server
app.listen(port, () => {
  console.log(`Google OAuth example running at http://localhost:${port}`);
  console.log('Authentication routes:');
  console.log('- GET /auth/oauth/google - Initiate Google OAuth flow');
  console.log('- GET /auth/oauth/google/callback - Google OAuth callback');
});

/**
 * Implementation Notes:
 * 
 * 1. Create a project in the Google Developer Console (https://console.developers.google.com/)
 * 2. Enable the Google+ API
 * 3. Configure OAuth consent screen
 * 4. Create OAuth client ID credentials (Web application type)
 * 5. Set authorized redirect URIs (e.g., http://localhost:3000/auth/oauth/google/callback)
 * 6. Set the environment variables:
 *    - GOOGLE_CLIENT_ID
 *    - GOOGLE_CLIENT_SECRET
 *    - GOOGLE_CALLBACK_URL
 *    - JWT_SECRET
 * 
 * The express-auth-toolkit will handle:
 * - Setting up the passport Google strategy
 * - Creating the necessary authentication routes
 * - Processing the OAuth callback
 * - Creating user accounts for new users
 * - Generating JWT tokens for authenticated users
 */ 