/**
 * User Service
 */
class UserService {
  constructor(options = {}) {
    this.dbAdapter = options.dbAdapter;
  }

  /**
   * Find user by ID
   * @param {String} userId - User ID
   * @returns {Object} User
   */
  async findById(userId) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return this._sanitizeUser(user);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by email
   * @param {String} email - User email
   * @returns {Object} User
   */
  async findByEmail(email) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      const user = await User.findOne({ email });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return this._sanitizeUser(user);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user
   * @param {String} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user
   */
  async updateUser(userId, updateData) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      // Prevent updating sensitive fields
      const safeUpdateData = { ...updateData };
      delete safeUpdateData.password;
      delete safeUpdateData.roles;
      delete safeUpdateData.isEmailVerified;
      delete safeUpdateData.emailVerificationToken;
      delete safeUpdateData.passwordResetToken;
      
      const user = await User.findByIdAndUpdate(
        userId,
        safeUpdateData,
        { new: true, runValidators: true }
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return this._sanitizeUser(user);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @returns {Object} Updated user
   */
  async updatePassword(userId, currentPassword, newPassword) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify current password
      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Update password
      user.password = newPassword;
      await user.save();
      
      return this._sanitizeUser(user);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user
   * @param {String} userId - User ID
   * @returns {Boolean} Success status
   */
  async deleteUser(userId) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      const result = await User.findByIdAndDelete(userId);
      
      if (!result) {
        throw new Error('User not found');
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user roles
   * @param {String} userId - User ID
   * @param {Array} roles - Array of roles
   * @returns {Object} Updated user
   */
  async updateRoles(userId, roles) {
    try {
      const User = this.dbAdapter.getModel('User');
      
      const user = await User.findByIdAndUpdate(
        userId,
        { roles },
        { new: true, runValidators: true }
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return this._sanitizeUser(user);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sanitize user object by removing sensitive fields
   * @param {Object} user - User object
   * @returns {Object} Sanitized user object
   * @private
   */
  _sanitizeUser(user) {
    const sanitizedUser = user.toObject ? user.toObject() : { ...user };
    
    delete sanitizedUser.password;
    delete sanitizedUser.emailVerificationToken;
    delete sanitizedUser.emailVerificationExpires;
    delete sanitizedUser.passwordResetToken;
    delete sanitizedUser.passwordResetExpires;
    delete sanitizedUser.twoFactorSecret;
    
    return sanitizedUser;
  }
}

module.exports = UserService; 