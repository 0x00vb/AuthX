/**
 * Passport authentication strategies
 * Configures passport for JWT and OAuth authentication
 */

const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: LocalStrategy } = require('passport-local');

/**
 * Initialize passport strategies
 * @param {Object} config - Configuration object
 */
const init = (config) => {
  // Configure JWT strategy
  passport.use(
    'jwt',
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.jwtOptions.secret
      },
      (jwtPayload, done) => {
        try {
          // Verify payload type (should be access token)
          if (jwtPayload.type !== 'access') {
            return done(null, false, { message: 'Invalid token type' });
          }
          
          // Payload contains user data
          return done(null, jwtPayload);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  
  // Configure Google OAuth strategy if enabled
  if (config.oauth && config.oauth.google) {
    passport.use(
      'google',
      new GoogleStrategy(
        {
          clientID: config.oauth.google.clientId,
          clientSecret: config.oauth.google.clientSecret,
          callbackURL: config.oauth.google.callbackUrl,
          scope: ['profile', 'email']
        },
        (accessToken, refreshToken, profile, done) => {
          try {
            // Pass the Google profile to the callback
            return done(null, profile);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }
  
  // Configure local strategy for username/password authentication
  passport.use(
    'local',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      (email, password, done) => {
        try {
          // Pass credentials to the callback
          return done(null, { email, password });
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  
  // Initialize passport
  passport.initialize();
};

/**
 * Create a Passport authentication middleware
 * @param {string} strategy - Passport strategy name
 * @param {Object} options - Passport authentication options
 * @returns {Function} - Express middleware function
 */
const authenticate = (strategy, options = {}) => {
  return passport.authenticate(strategy, {
    session: false,
    ...options
  });
};

module.exports = {
  init,
  authenticate,
  passport
}; 