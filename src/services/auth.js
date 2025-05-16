/**
 * Authentication Service
 */
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class AuthService {
  constructor(options = {}) {
    this.dbAdapter = options.dbAdapter;
    this.config = options.config;
    this.tokenService = options.tokenService;
    this.emailService = options.emailService;
  }

  /**
   * Register a new user
   * @param {Object} userData - User data
   * @returns {Object} New user and verification token if email verification enabled
   */
  async register(userData) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const user = new User({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roles: userData.roles || ['user'],
      });

      // If email verification is enabled, generate verification token
      if (this.config.auth.useEmailVerification) {
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours expiry
        
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = verificationExpires;
        
        // Save user
        await user.save();
        
        // Send verification email
        await this.emailService.sendVerificationEmail(user.email, verificationToken);
        
        return {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
            isEmailVerified: user.isEmailVerified,
          },
          message: 'User registered successfully. Please verify your email address.',
        };
      } else {
        // If email verification is disabled, set user as verified
        user.isEmailVerified = true;
        await user.save();
        
        return {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
            isEmailVerified: user.isEmailVerified,
          },
          message: 'User registered successfully.',
        };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login a user
   * @param {String} email - User email
   * @param {String} password - User password
   * @returns {Object} Access token and refresh token
   */
  async login(email, password) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      // Find the user
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if email is verified if required
      if (this.config.auth.useEmailVerification && !user.isEmailVerified) {
        throw new Error('Please verify your email before logging in');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      
      // Create response
      const response = {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
        },
        accessToken,
      };

      // If using refresh tokens, generate and add to response
      if (this.config.auth.useRefreshToken) {
        const refreshToken = await this.generateRefreshToken(user);
        response.refreshToken = refreshToken;
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify email
   * @param {String} token - Email verification token
   * @returns {Object} Success message
   */
  async verifyEmail(token) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      // Find user with this token
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new Error('Invalid or expired verification token');
      }

      // Update user
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      return {
        message: 'Email verified successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Request password reset
   * @param {String} email - User email
   * @returns {Object} Success message
   */
  async requestPasswordReset(email) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry
      
      // Update user
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpires;
      await user.save();
      
      // Send reset email
      await this.emailService.sendPasswordResetEmail(user.email, resetToken);
      
      return {
        message: 'Password reset email sent',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password
   * @param {String} token - Password reset token
   * @param {String} newPassword - New password
   * @returns {Object} Success message
   */
  async resetPassword(token, newPassword) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      // Find user with this token
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Update user password
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      
      // Blacklist all existing tokens for this user
      await this.tokenService.blacklistAllUserTokens(user._id);

      return {
        message: 'Password reset successful',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh access token
   * @param {String} refreshToken - Refresh token
   * @returns {Object} New access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.config.jwt.refreshTokenSecret);
      
      // Check if token is blacklisted
      const isBlacklisted = await this.tokenService.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new Error('Invalid refresh token');
      }
      
      // Find user
      const User = this.dbAdapter.getModel('User');
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);
      
      return {
        accessToken,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout
   * @param {String} refreshToken - Refresh token to blacklist
   * @returns {Object} Success message
   */
  async logout(refreshToken) {
    try {
      if (refreshToken) {
        // Blacklist refresh token
        await this.tokenService.blacklistToken(refreshToken);
      }
      
      return {
        message: 'Logged out successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate access token
   * @param {Object} user - User object
   * @returns {String} JWT token
   * @private
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        email: user.email,
        roles: user.roles,
      },
      this.config.jwt.accessTokenSecret,
      { expiresIn: this.config.jwt.accessTokenExpiry }
    );
  }

  /**
   * Generate refresh token
   * @param {Object} user - User object
   * @returns {String} JWT token
   * @private
   */
  async generateRefreshToken(user) {
    // Create JWT
    const refreshToken = jwt.sign(
      {
        userId: user._id,
        tokenId: uuidv4(),
      },
      this.config.jwt.refreshTokenSecret,
      { expiresIn: this.config.jwt.refreshTokenExpiry }
    );
    
    // Decode for expiry date
    const decoded = jwt.decode(refreshToken);
    const expiresAt = new Date(decoded.exp * 1000);
    
    // Store token in database
    await this.tokenService.saveToken({
      token: refreshToken,
      type: 'refresh',
      userId: user._id,
      expiresAt,
    });
    
    return refreshToken;
  }
}

module.exports = AuthService; 