/**
 * Authentication Service
 * Handles user authentication and token management
 */

const {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateAuthTokens,
  verifyToken,
  extractTokenFromRequest,
  InvalidCredentialsError,
  UserNotFoundError,
  EmailInUseError,
  ValidationError,
  NotVerifiedError,
  InvalidTokenError
} = require('../utils');

/**
 * Create an authentication service
 * @param {Object} config - Configuration object
 * @param {Object} adapter - Database adapter
 * @returns {Object} - Authentication service functions
 */
module.exports = (config, adapter) => {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Registered user and tokens
   */
  const register = async (userData) => {
    // Check if email is already in use
    const existingUser = await adapter.getUserByEmail(userData.email);
    if (existingUser) {
      throw new EmailInUseError();
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(userData.password, config.passwordPolicy);
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.errors);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(userData.password);
    
    // Prepare user data
    const userToCreate = {
      email: userData.email,
      password: hashedPassword,
      name: userData.name || null,
      role: userData.role || 'user',
      isVerified: !config.requireEmailVerification
    };
    
    // Create user
    const user = await adapter.createUser(userToCreate);
    
    // Generate auth tokens
    const tokens = generateAuthTokens(user, config);
    
    // Store refresh token if enabled
    if (config.useRefreshTokens && tokens.refreshToken) {
      const expiresIn = new Date();
      expiresIn.setSeconds(
        expiresIn.getSeconds() + 
        config.jwtOptions.refreshExpiresIn
      );
      
      await adapter.storeRefreshToken(user.id, tokens.refreshToken, expiresIn);
    }
    
    return { user, tokens };
  };
  
  /**
   * Login a user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Logged in user and tokens
   */
  const login = async (email, password) => {
    // Find user by email
    const user = await adapter.getUserByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    
    // Verify password
    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      throw new InvalidCredentialsError();
    }
    
    // Check if email is verified
    if (config.requireEmailVerification && !user.isVerified) {
      throw new NotVerifiedError();
    }
    
    // Generate auth tokens
    const tokens = generateAuthTokens(user, config);
    
    // Store refresh token if enabled
    if (config.useRefreshTokens && tokens.refreshToken) {
      const expiresIn = new Date();
      expiresIn.setSeconds(
        expiresIn.getSeconds() + 
        config.jwtOptions.refreshExpiresIn
      );
      
      await adapter.storeRefreshToken(user.id, tokens.refreshToken, expiresIn);
    }
    
    return { user, tokens };
  };
  
  /**
   * Logout a user
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<boolean>} - Logout success
   */
  const logout = async (refreshToken) => {
    if (!refreshToken) {
      return false;
    }
    
    // Delete refresh token
    if (config.useRefreshTokens) {
      await adapter.deleteRefreshToken(refreshToken);
    }
    
    return true;
  };
  
  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} - New access token
   */
  const refreshToken = async (refreshToken) => {
    if (!config.useRefreshTokens) {
      throw new InvalidTokenError('Refresh tokens are not enabled');
    }
    
    if (!refreshToken) {
      throw new InvalidTokenError('Refresh token is required');
    }
    
    // Verify refresh token
    try {
      const decoded = verifyToken(refreshToken, config.jwtOptions.secret);
      
      if (decoded.type !== 'refresh') {
        throw new InvalidTokenError('Invalid token type');
      }
      
      // Check if token is in database
      const storedToken = await adapter.getRefreshToken(refreshToken);
      if (!storedToken) {
        throw new InvalidTokenError('Invalid refresh token');
      }
      
      // Get user
      const user = await adapter.getUserById(decoded.id);
      if (!user) {
        throw new UserNotFoundError();
      }
      
      // Generate new tokens
      const tokens = generateAuthTokens(user, config);
      
      // Store new refresh token if enabled
      if (tokens.refreshToken) {
        const expiresIn = new Date();
        expiresIn.setSeconds(
          expiresIn.getSeconds() + 
          config.jwtOptions.refreshExpiresIn
        );
        
        await adapter.storeRefreshToken(user.id, tokens.refreshToken, expiresIn);
        
        // Delete old refresh token
        await adapter.deleteRefreshToken(refreshToken);
      }
      
      return tokens;
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new InvalidTokenError();
      }
      throw error;
    }
  };
  
  /**
   * Verify and decode a JWT token
   * @param {string} token - JWT token
   * @returns {Object} - Decoded token payload
   */
  const verifyJwtToken = (token) => {
    try {
      return verifyToken(token, config.jwtOptions.secret);
    } catch (error) {
      throw new InvalidTokenError();
    }
  };
  
  /**
   * Get authenticated user from request
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} - Authenticated user
   */
  const getAuthenticatedUser = async (req) => {
    const token = extractTokenFromRequest(req, config);
    if (!token) {
      throw new InvalidTokenError('No token provided');
    }
    
    // Check if token is blacklisted
    if (config.tokenBlacklisting) {
      const isBlacklisted = await adapter.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new InvalidTokenError('Token has been revoked');
      }
    }
    
    // Verify token
    const decoded = verifyJwtToken(token);
    
    // Get user from database
    const user = await adapter.getUserById(decoded.id);
    if (!user) {
      throw new UserNotFoundError();
    }
    
    return user;
  };
  
  /**
   * Blacklist a token
   * @param {string} token - JWT token
   * @returns {Promise<boolean>} - Blacklist success
   */
  const blacklistToken = async (token) => {
    if (!config.tokenBlacklisting) {
      return false;
    }
    
    if (!token) {
      return false;
    }
    
    try {
      // Verify token to get expiration
      const decoded = verifyToken(token, config.jwtOptions.secret);
      
      // Store in blacklist until expiration
      const expiresAt = new Date(decoded.exp * 1000);
      await adapter.blacklistToken(token, expiresAt);
      
      return true;
    } catch (error) {
      // If token is invalid or expired, no need to blacklist
      return false;
    }
  };
  
  return {
    register,
    login,
    logout,
    refreshToken,
    verifyJwtToken,
    getAuthenticatedUser,
    blacklistToken
  };
}; 