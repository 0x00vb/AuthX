/**
 * User routes
 * Routes for managing user profiles and account operations
 */

const express = require('express');

/**
 * Initialize user routes
 * @param {Object} config - Configuration object
 * @param {Object} services - Authentication services
 * @param {Object} middlewares - Authentication middlewares
 * @returns {Object} - Express router
 */
module.exports = (config, services, middlewares) => {
  const router = express.Router();
  
  /**
   * @route GET /users/profile
   * @description Get user profile
   * @access Private
   */
  router.get(
    '/profile',
    middlewares.requireAuth,
    middlewares.validate2FA,
    async (req, res, next) => {
      try {
        // Get user profile
        const user = await services.user.getUserById(req.user.id);
        
        res.json({ user });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * @route GET /users/me
   * @description Get user profile (alternative endpoint)
   * @access Private
   */
  router.get(
    '/me',
    middlewares.requireAuth,
    middlewares.validate2FA,
    async (req, res, next) => {
      try {
        // Get user profile
        const user = await services.user.getUserById(req.user.id);
        
        res.json({ user });
      } catch (error) {
        next(error);
      }
    }
  );
  
  /**
   * @route PUT /users/profile
   * @description Update user profile
   * @access Private
   */
  router.put(
    '/profile',
    middlewares.requireAuth,
    middlewares.validate2FA,
    async (req, res, next) => {
      try {
        const { name, ...otherFields } = req.body;
        const updates = { name, ...otherFields };
        
        // Update user profile
        const user = await services.user.updateUser(req.user.id, updates);
        
        res.json({ 
          message: 'Profile updated successfully',
          user 
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  /**
   * @route POST /users/change-password
   * @description Change user password
   * @access Private
   */
  router.post(
    '/change-password',
    middlewares.requireAuth,
    middlewares.validate2FA,
    async (req, res, next) => {
      try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
          return res.status(400).json({ 
            error: { 
              message: 'Current password and new password are required' 
            } 
          });
        }
        
        // Change password
        await services.user.changePassword(req.user.id, currentPassword, newPassword);
        
        res.json({ 
          message: 'Password changed successfully' 
        });
      } catch (error) {
        // Handle specific errors with appropriate status codes
        if (error.name === 'InvalidCredentialsError') {
          return res.status(401).json({
            error: {
              message: error.message || 'Invalid credentials'
            }
          });
        } else if (error.name === 'ValidationError') {
          return res.status(400).json({
            error: {
              message: error.message || 'Validation error',
              details: error.details
            }
          });
        }

        next(error);
      }
    }
  );
  
  /**
   * @route DELETE /users/account
   * @description Delete user account
   * @access Private
   */
  router.delete(
    '/account',
    middlewares.requireAuth,
    middlewares.validate2FA,
    async (req, res, next) => {
      try {
        // Delete user account
        await services.user.deleteUser(req.user.id);
        
        res.json({ 
          message: 'Account deleted successfully' 
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * @route DELETE /users/me
   * @description Delete user account (alternative endpoint)
   * @access Private
   */
  router.delete(
    '/me',
    middlewares.requireAuth,
    middlewares.validate2FA,
    async (req, res, next) => {
      try {
        // Delete user account
        await services.user.deleteUser(req.user.id);
        
        res.json({ 
          message: 'Account deleted successfully' 
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * @route DELETE /user
   * @description Delete user account (alternative endpoint)
   * @access Private
   */
  router.delete(
    '/',
    middlewares.requireAuth,
    middlewares.validate2FA,
    async (req, res, next) => {
      try {
        // Delete user account
        await services.user.deleteUser(req.user.id);
        
        res.json({ 
          message: 'Account deleted successfully' 
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  /**
   * @route PUT /users/:id/role
   * @description Update user role (admin only)
   * @access Private (Admin)
   */
  router.put(
    '/:id/role',
    middlewares.requireAuth,
    middlewares.validate2FA,
    middlewares.requireRole('admin'),
    async (req, res, next) => {
      try {
        const { id } = req.params;
        const { role } = req.body;
        
        if (!role) {
          return res.status(400).json({ 
            error: { 
              message: 'Role is required' 
            } 
          });
        }
        
        // Update user role
        const user = await services.user.updateUserRole(id, role, req.user.id);
        
        res.json({ 
          message: 'User role updated successfully',
          user 
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  /**
   * @route GET /users
   * @description Get all users (admin only)
   * @access Private (Admin)
   */
  router.get(
    '/',
    middlewares.requireAuth,
    middlewares.validate2FA,
    middlewares.requireRole('admin'),
    async (req, res, next) => {
      try {
        // This route would typically be implemented by the application,
        // as it depends on the specific database and pagination requirements.
        res.status(501).json({ 
          error: { 
            message: 'Not implemented in the auth toolkit. Implement this in your application.' 
          } 
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  return router;
}; 