/**
 * Two-Factor Authentication Routes
 */
const express = require('express');
const middlewares = require('../middlewares');

/**
 * Create 2FA router
 * @param {Object} authX - AuthX instance
 * @param {Object} services - Services
 * @returns {Object} Express router
 */
const create2FARouter = (authX, services) => {
  const router = express.Router();
  const { TwoFactorService } = services;
  const { auth: authMiddleware } = middlewares;

  // All 2FA routes require authentication
  router.use(authMiddleware.verifyToken(authX));

  /**
   * @route POST /2fa/enable
   * @description Enable 2FA and generate secret
   * @access Private
   */
  router.post('/enable', async (req, res, next) => {
    try {
      const result = await TwoFactorService.enable2FA(req.user.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route POST /2fa/verify
   * @description Verify 2FA code and complete setup
   * @access Private
   */
  router.post('/verify', async (req, res, next) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: '2FA code is required' });
      }
      
      const result = await TwoFactorService.complete2FASetup(req.user.userId, code);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route POST /2fa/disable
   * @description Disable 2FA
   * @access Private
   */
  router.post('/disable', authMiddleware.require2FA(authX.dbAdapter), async (req, res, next) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: '2FA code is required' });
      }
      
      // Verify the code first
      const isValid = await TwoFactorService.verify2FACode(req.user.userId, code);
      
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid 2FA code' });
      }
      
      // Disable 2FA
      const result = await TwoFactorService.disable2FA(req.user.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route POST /2fa/validate
   * @description Validate 2FA code
   * @access Private
   */
  router.post('/validate', authMiddleware.require2FA(authX.dbAdapter), async (req, res, next) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: '2FA code is required' });
      }
      
      const isValid = await TwoFactorService.verify2FACode(req.user.userId, code);
      
      res.json({ valid: isValid });
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route POST /2fa/recovery
   * @description Use recovery code
   * @access Private
   */
  router.post('/recovery', authMiddleware.require2FA(authX.dbAdapter), async (req, res, next) => {
    try {
      const { recoveryCode } = req.body;
      
      if (!recoveryCode) {
        return res.status(400).json({ message: 'Recovery code is required' });
      }
      
      const result = await TwoFactorService.useRecoveryCode(req.user.userId, recoveryCode);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route POST /2fa/recovery/generate
   * @description Generate new recovery codes
   * @access Private
   */
  router.post('/recovery/generate', authMiddleware.require2FA(authX.dbAdapter), async (req, res, next) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: '2FA code is required' });
      }
      
      // Verify the code first
      const isValid = await TwoFactorService.verify2FACode(req.user.userId, code);
      
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid 2FA code' });
      }
      
      // Generate new recovery codes
      const result = await TwoFactorService.generateNewRecoveryCodes(req.user.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
};

module.exports = create2FARouter; 