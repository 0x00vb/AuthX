/**
 * OAuth routes
 * Routes for third-party authentication (Google, GitHub, etc.)
 */

const express = require('express');

/**
 * Initialize OAuth routes
 * @param {Object} config - Configuration object
 * @param {Object} services - Authentication services
 * @param {Object} middlewares - Authentication middlewares
 * @returns {Object} - Express router
 */
module.exports = (config, services, middlewares) => {
  const router = express.Router();
  
  // Skip if OAuth is not configured
  if (!config.oauth) {
    return router;
  }
  
  /**
   * @route GET /oauth/google
   * @description Initiate Google OAuth authentication
   * @access Public
   */
  if (config.oauth.google) {
    router.get(
      '/google',
      middlewares.passport.authenticate('google', {
        scope: ['profile', 'email']
      })
    );
    
    /**
     * @route GET /oauth/google/callback
     * @description Google OAuth callback
     * @access Public
     */
    router.get(
      '/google/callback',
      middlewares.passport.authenticate('google', {
        session: false,
        failureRedirect: config.oauth.google.failureRedirect || '/login'
      }),
      async (req, res, next) => {
        try {
          // Check if user exists by email
          const email = req.user.emails[0].value;
          let user;
          
          try {
            user = await services.user.getUserByEmail(email);
          } catch (error) {
            // User doesn't exist, create a new one
            if (error.name === 'UserNotFoundError') {
              // Generate a random password (user won't need it as they'll login via OAuth)
              const password = Math.random().toString(36).slice(-10) + 
                          Math.random().toString(36).slice(-10);
              
              // Register user
              const result = await services.auth.register({
                email,
                password,
                name: req.user.displayName || '',
                isVerified: true // Auto verify OAuth users
              });
              
              user = result.user;
            } else {
              throw error;
            }
          }
          
          // Generate auth tokens
          const tokens = services.auth.generateTokens(user);
          
          // Set refresh token in cookie if using session cookies
          if (config.useSessionCookies && tokens.refreshToken) {
            res.cookie('refreshToken', tokens.refreshToken, {
              httpOnly: true,
              secure: config.cookieOptions.secure,
              sameSite: config.cookieOptions.sameSite,
              maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
          }
          
          // Redirect to success URL with token
          const successRedirect = config.oauth.google.successRedirect || '/';
          const redirectUrl = new URL(successRedirect, 
            req.protocol + '://' + req.get('host'));
          
          // Add token as query parameter (for client-side processing)
          redirectUrl.searchParams.append('token', tokens.accessToken);
          
          res.redirect(redirectUrl.toString());
        } catch (error) {
          next(error);
        }
      }
    );
  }
  
  /**
   * @route GET /oauth/github
   * @description Initiate GitHub OAuth authentication
   * @access Public
   */
  if (config.oauth.github) {
    router.get(
      '/github',
      middlewares.passport.authenticate('github', {
        scope: ['user:email']
      })
    );
    
    /**
     * @route GET /oauth/github/callback
     * @description GitHub OAuth callback
     * @access Public
     */
    router.get(
      '/github/callback',
      middlewares.passport.authenticate('github', {
        session: false,
        failureRedirect: config.oauth.github.failureRedirect || '/login'
      }),
      async (req, res, next) => {
        try {
          // Similar implementation as Google callback
          // This would be implemented based on the specific GitHub strategy
          
          // For now, just redirect to failure URL
          const failureRedirect = config.oauth.github.failureRedirect || '/login';
          res.redirect(failureRedirect);
        } catch (error) {
          next(error);
        }
      }
    );
  }
  
  return router;
}; 