/**
 * User Routes
 */
const express = require('express');

/**
 * Create user router
 * @param {Object} authX - AuthX instance
 * @param {Object} services - Services
 * @returns {Object} Express router
 */
const createUserRouter = (authX, services) => {
  const router = express.Router();
  const { UserService } = services;
  const { auth: authMiddleware } = authX.middlewares;

  // All user routes require authentication
  router.use(authMiddleware.verifyToken(authX));

  /**
   * @route GET /users/me
   * @description Get current user profile
   * @access Private
   */
  router.get('/me', async (req, res, next) => {
    try {
      const user = await UserService.findById(req.user.userId);
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route PUT /users/me
   * @description Update current user profile
   * @access Private
   */
  router.put('/me', async (req, res, next) => {
    try {
      const { firstName, lastName } = req.body;
      
      const updatedUser = await UserService.updateUser(req.user.userId, {
        firstName,
        lastName,
      });
      
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route PUT /users/me/password
   * @description Update current user password
   * @access Private
   */
  router.put('/me/password', async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }
      
      await UserService.updatePassword(req.user.userId, currentPassword, newPassword);
      
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route DELETE /users/me
   * @description Delete current user
   * @access Private
   */
  router.delete('/me', async (req, res, next) => {
    try {
      await UserService.deleteUser(req.user.userId);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route GET /users/:id
   * @description Get user by ID (admin only)
   * @access Private/Admin
   */
  router.get('/:id', authMiddleware.hasRole('admin'), async (req, res, next) => {
    try {
      const user = await UserService.findById(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route PUT /users/:id/roles
   * @description Update user roles (admin only)
   * @access Private/Admin
   */
  router.put('/:id/roles', authMiddleware.hasRole('admin'), async (req, res, next) => {
    try {
      const { roles } = req.body;
      
      if (!roles || !Array.isArray(roles)) {
        return res.status(400).json({ message: 'Roles array is required' });
      }
      
      const updatedUser = await UserService.updateRoles(req.params.id, roles);
      
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });

  return router;
};

module.exports = createUserRouter; 