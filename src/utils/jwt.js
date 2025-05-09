/**
 * JWT Token Utilities
 */
const jwt = require('jsonwebtoken');

/**
 * Generate a new JWT token
 * @param {Object} payload - Token payload
 * @param {string} secret - JWT secret key
 * @param {Object} options - JWT sign options
 * @returns {string} - JWT token
 */
const generateToken = (payload, secret, options = {}) => {
  return jwt.sign(payload, secret, options);
};

/**
 * Generate access and refresh tokens for a user
 * @param {Object} user - User object
 * @param {Object} config - JWT configuration
 * @returns {Object} - Access and refresh tokens
 */
const generateAuthTokens = (user, config) => {
  // Extract only necessary user data for JWT payload
  const userPayload = {
    id: user.id,
    email: user.email,
    role: user.role || 'user'
  };

  // Generate access token
  const accessToken = generateToken(
    { ...userPayload, type: 'access' },
    config.jwtOptions.secret,
    { expiresIn: config.jwtOptions.accessExpiresIn }
  );

  // Generate refresh token if enabled
  let refreshToken = null;
  if (config.useRefreshTokens) {
    refreshToken = generateToken(
      { ...userPayload, type: 'refresh' },
      config.jwtOptions.secret,
      { expiresIn: config.jwtOptions.refreshExpiresIn }
    );
  }

  return {
    accessToken,
    refreshToken,
    expiresIn: getExpirationFromString(config.jwtOptions.accessExpiresIn)
  };
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @param {string} secret - JWT secret key
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid
 */
const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
};

/**
 * Convert JWT expiration string (e.g., '15m', '7d') to seconds
 * @param {string} expiresIn - JWT expiration string
 * @returns {number} - Expiration in seconds
 */
const getExpirationFromString = (expiresIn) => {
  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1), 10);
  
  if (isNaN(value)) {
    return 900; // Default to 15 minutes (900 seconds)
  }
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return 900; // Default to 15 minutes
  }
};

/**
 * Extract token from request
 * @param {Object} req - Express request object
 * @param {Object} config - JWT configuration
 * @returns {string|null} - JWT token or null if not found
 */
const extractTokenFromRequest = (req, config) => {
  // Check Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    return req.headers.authorization.split(' ')[1];
  }
  
  // Check cookies if session cookies are enabled
  if (config.useSessionCookies && req.cookies) {
    // Check for accessToken cookie first
    if (req.cookies.accessToken) {
      return req.cookies.accessToken;
    }
    
    // Also check for token cookie (for compatibility)
    if (req.cookies.token) {
      return req.cookies.token;
    }
  }
  
  // Check query parameters as a last resort
  if (req.query && req.query.token) {
    return req.query.token;
  }
  
  return null;
};

module.exports = {
  generateToken,
  generateAuthTokens,
  verifyToken,
  extractTokenFromRequest,
  getExpirationFromString
}; 