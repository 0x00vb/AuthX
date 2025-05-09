/**
 * User Service
 * Handles user profile management and account operations
 */

const {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateVerificationToken,
  generatePasswordResetToken,
  UserNotFoundError,
  ValidationError,
  InvalidCredentialsError,
  InvalidTokenError,
  AccessDeniedError
} = require('../utils');

/**
 * Create a user service
 * @param {Object} config - Configuration object
 * @param {Object} adapter - Database adapter
 * @returns {Object} - User service functions
 */
module.exports = (config, adapter) => {
  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} - User object
   */
  const getUserById = async (id) => {
    const user = await adapter.getUserById(id);
    if (!user) {
      throw new UserNotFoundError();
    }
    
    // Remove sensitive data
    delete user.password;
    
    return user;
  };
  
  /**
   * Get a user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} - User object
   */
  const getUserByEmail = async (email) => {
    const user = await adapter.getUserByEmail(email);
    if (!user) {
      throw new UserNotFoundError();
    }
    
    // Remove sensitive data
    delete user.password;
    
    return user;
  };
  
  /**
   * Update a user's profile
   * @param {string} id - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} - Updated user
   */
  const updateUser = async (id, updates) => {
    // Ensure password is not updated here
    if (updates.password) {
      delete updates.password;
    }
    
    // Don't allow role updates from this method
    if (updates.role) {
      delete updates.role;
    }
    
    // For tests, if email is being updated, handle verification flag
    if (updates.email && config.requireEmailVerification) {
      updates.isVerified = false;
    }
    
    const updatedUser = await adapter.updateUser(id, updates);
    if (!updatedUser) {
      throw new UserNotFoundError();
    }
    
    // Remove sensitive data
    delete updatedUser.password;
    
    return updatedUser;
  };
  
  /**
   * Change a user's password
   * @param {string} id - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} - Password change success
   */
  const changePassword = async (id, currentPassword, newPassword) => {
    // Validate new password first
    const passwordValidation = validatePasswordStrength(newPassword, config.passwordPolicy);
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.errors);
    }
    
    // Get user with password
    const user = await adapter.getUserById(id);
    if (!user) {
      throw new UserNotFoundError();
    }
    
    // Check if user has a password set (for password comparison)
    if (!user.password) {
      throw new InvalidCredentialsError('Password is not set for this user');
    }
    
    try {
      // Verify current password
      const isValid = await verifyPassword(currentPassword, user.password);
      if (!isValid) {
        throw new InvalidCredentialsError('Current password is incorrect');
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user
      await adapter.updateUser(id, { password: hashedPassword });
      
      // Invalidate existing refresh tokens
      if (config.useRefreshTokens) {
        await adapter.deleteUserRefreshTokens(id);
      }
      
      return true;
    } catch (error) {
      if (error instanceof InvalidCredentialsError || error instanceof ValidationError) {
        throw error;
      }
      
      // If it's a bcrypt error, provide a more helpful message
      if (error.message && (
          error.message.includes('data and hash arguments required') ||
          error.message.includes('Illegal arguments') ||
          error.message.includes('Invalid salt')
        )) {
        throw new InvalidCredentialsError('Password verification failed: Invalid password format');
      }
      
      throw error;
    }
  };
  
  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} - Deletion success
   */
  const deleteUser = async (id) => {
    const deleted = await adapter.deleteUser(id);
    if (!deleted) {
      throw new UserNotFoundError();
    }
    
    return true;
  };
  
  /**
   * Update a user's role
   * @param {string} id - User ID
   * @param {string} role - New role
   * @param {string} currentUserId - Current user's ID (admin)
   * @returns {Promise<Object>} - Updated user
   */
  const updateUserRole = async (id, role, currentUserId) => {
    // Get the admin user
    const adminUser = await adapter.getUserById(currentUserId);
    if (!adminUser || adminUser.role !== 'admin') {
      throw new AccessDeniedError('Only admins can update user roles');
    }
    
    // Don't allow admins to change their own role
    if (id === currentUserId) {
      throw new AccessDeniedError('Cannot change your own role');
    }
    
    // Validate role
    const validRoles = ['user', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
    
    // Update user role
    const updatedUser = await adapter.updateUser(id, { role });
    if (!updatedUser) {
      throw new UserNotFoundError();
    }
    
    // Remove sensitive data
    delete updatedUser.password;
    
    return updatedUser;
  };
  
  /**
   * Request email verification
   * @param {string} email - User email
   * @returns {Promise<string>} - Verification token
   */
  const requestEmailVerification = async (email) => {
    const user = await adapter.getUserByEmail(email);
    if (!user) {
      throw new UserNotFoundError();
    }
    
    if (user.isVerified) {
      return null; // Already verified
    }
    
    // Generate verification token
    const token = generateVerificationToken();
    
    // Calculate expiration (24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Store verification token
    await adapter.storeVerificationToken(user.id, token, expiresAt);
    
    return token;
  };
  
  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise<boolean>} - Verification success
   */
  const verifyEmail = async (token) => {
    // Get verification token
    const verificationToken = await adapter.getVerificationToken(token);
    if (!verificationToken) {
      throw new InvalidTokenError('Invalid or expired verification token');
    }
    
    // Update user
    const user = await adapter.getUserById(verificationToken.userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    
    // Mark user as verified
    await adapter.updateUser(user.id, { isVerified: true });
    
    // Delete verification token
    await adapter.deleteVerificationToken(token);
    
    return true;
  };
  
  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<string>} - Password reset token
   */
  const requestPasswordReset = async (email) => {
    const user = await adapter.getUserByEmail(email);
    if (!user) {
      throw new UserNotFoundError();
    }
    
    // Generate password reset token
    const token = generatePasswordResetToken();
    
    // Calculate expiration (1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    // Store password reset token
    await adapter.storePasswordResetToken(user.id, token, expiresAt);
    
    return token;
  };
  
  /**
   * Reset password with token
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} - Password reset success
   */
  const resetPassword = async (token, newPassword) => {
    // Validate password first
    const passwordValidation = validatePasswordStrength(newPassword, config.passwordPolicy);
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.errors);
    }
    
    // Get password reset token
    const resetToken = await adapter.getPasswordResetToken(token);
    if (!resetToken) {
      throw new InvalidTokenError('Invalid or expired password reset token');
    }
    
    // Get user
    const user = await adapter.getUserById(resetToken.userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update user
    await adapter.updateUser(user.id, { password: hashedPassword });
    
    // Delete password reset token
    await adapter.deletePasswordResetToken(token);
    
    // Invalidate existing refresh tokens
    if (config.useRefreshTokens) {
      await adapter.deleteUserRefreshTokens(user.id);
    }
    
    return true;
  };
  
  return {
    getUserById,
    getUserByEmail,
    updateUser,
    changePassword,
    deleteUser,
    updateUserRole,
    requestEmailVerification,
    verifyEmail,
    requestPasswordReset,
    resetPassword
  };
}; 