/**
 * Two-factor authentication routes
 * Routes for managing 2FA settings
 */

const express = require('express');

/**
 * Initialize two-factor authentication routes
 * @param {Object} config - Configuration object
 * @param {Object} services - Authentication services
 * @param {Object} middlewares - Authentication middlewares
 * @returns {Object} - Express router
 */
module.exports = (config, services, middlewares) => {
  const router = express.Router();
  
  /**
   * @route GET /2fa/status
   * @description Check if 2FA is enabled for the user
   * @access Private
   */
  router.get(
    '/status',
    middlewares.requireAuth,
    async (req, res, next) => {
      try {
        // Check if 2FA is enabled globally
        if (!config.enable2FA) {
          return res.json({ enabled: false, reason: '2FA is not enabled for this application' });
        }
        
        // Check if 2FA is enabled for the user
        const enabled = await services.twoFactorAuth.isEnabled(req.user.id);
        
        res.json({ enabled });
      } catch (error) {
        next(error);
      }
    }
  );
  
  /**
   * @route POST /2fa/generate
   * @description Generate 2FA secret and QR code
   * @access Private
   */
  router.post(
    '/generate',
    middlewares.requireAuth,
    async (req, res, next) => {
      try {
        // Check if 2FA is enabled globally
        if (!config.enable2FA) {
          return res.status(400).json({ 
            error: { 
              message: '2FA is not enabled for this application' 
            } 
          });
        }
        
        // Check if 2FA is already enabled for the user
        const enabled = await services.twoFactorAuth.isEnabled(req.user.id);
        if (enabled) {
          return res.status(400).json({ 
            error: { 
              message: '2FA is already enabled for this user' 
            } 
          });
        }
        
        // Generate 2FA secret and QR code
        const { secret, qrCode, recoveryCodes } = await services.twoFactorAuth.generateSecret(
          req.user.id,
          req.user.email
        );
        
        res.json({
          secret,
          qrCode,
          recoveryCodes
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  /**
   * @route POST /2fa/enable
   * @description Enable 2FA for the user
   * @access Private
   */
  router.post(
    '/enable',
    middlewares.requireAuth,
    async (req, res, next) => {
      try {
        const { secret, token, recoveryCodes } = req.body;
        
        if (!secret || !token || !recoveryCodes) {
          return res.status(400).json({ 
            error: { 
              message: 'Secret, token, and recoveryCodes are required' 
            } 
          });
        }
        
        // Check if 2FA is enabled globally
        if (!config.enable2FA) {
          return res.status(400).json({ 
            error: { 
              message: '2FA is not enabled for this application' 
            } 
          });
        }
        
        // Check if 2FA is already enabled for the user
        const enabled = await services.twoFactorAuth.isEnabled(req.user.id);
        if (enabled) {
          return res.status(400).json({ 
            error: { 
              message: '2FA is already enabled for this user' 
            } 
          });
        }
        
        // Enable 2FA
        await services.twoFactorAuth.enable(req.user.id, secret, token, recoveryCodes);
        
        res.json({ 
          message: '2FA enabled successfully' 
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  /**
   * @route POST /2fa/disable
   * @description Disable 2FA for the user
   * @access Private
   */
  router.post(
    '/disable',
    middlewares.requireAuth,
    async (req, res, next) => {
      try {
        const { token } = req.body;
        
        if (!token) {
          return res.status(400).json({ 
            error: { 
              message: 'Token is required' 
            } 
          });
        }
        
        // Check if 2FA is enabled globally
        if (!config.enable2FA) {
          return res.status(400).json({ 
            error: { 
              message: '2FA is not enabled for this application' 
            } 
          });
        }
        
        // Disable 2FA
        await services.twoFactorAuth.disable(req.user.id, token);
        
        res.json({ 
          message: '2FA disabled successfully' 
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  /**
   * @route POST /2fa/verify
   * @description Verify a 2FA token
   * @access Private
   */
  router.post(
    '/verify',
    middlewares.requireAuth,
    async (req, res, next) => {
      try {
        const { token } = req.body;
        
        if (!token) {
          return res.status(400).json({ 
            error: { 
              message: 'Token is required' 
            } 
          });
        }
        
        // Check if 2FA is enabled globally
        if (!config.enable2FA) {
          return res.status(400).json({ 
            error: { 
              message: '2FA is not enabled for this application' 
            } 
          });
        }
        
        // Verify token
        const isValid = await services.twoFactorAuth.verify(req.user.id, token);
        
        res.json({ 
          valid: isValid 
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  /**
   * @route GET /2fa/recovery-codes
   * @description Get recovery codes for the user
   * @access Private
   */
  router.get(
    '/recovery-codes',
    middlewares.requireAuth,
    middlewares.validate2FA,
    async (req, res, next) => {
      try {
        // Check if 2FA is enabled globally
        if (!config.enable2FA) {
          return res.status(400).json({ 
            error: { 
              message: '2FA is not enabled for this application' 
            } 
          });
        }
        
        // Get recovery codes
        const recoveryCodes = await services.twoFactorAuth.getRecoveryCodes(req.user.id);
        
        res.json({ 
          recoveryCodes 
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  /**
   * @route POST /2fa/generate-recovery-codes
   * @description Generate new recovery codes for the user
   * @access Private
   */
  router.post(
    '/generate-recovery-codes',
    middlewares.requireAuth,
    middlewares.validate2FA,
    async (req, res, next) => {
      try {
        const { token } = req.body;
        
        if (!token) {
          return res.status(400).json({ 
            error: { 
              message: 'Token is required' 
            } 
          });
        }
        
        // Check if 2FA is enabled globally
        if (!config.enable2FA) {
          return res.status(400).json({ 
            error: { 
              message: '2FA is not enabled for this application' 
            } 
          });
        }
        
        // Generate new recovery codes
        const recoveryCodes = await services.twoFactorAuth.generateNewRecoveryCodes(req.user.id, token);
        
        res.json({ 
          message: 'Recovery codes generated successfully',
          recoveryCodes 
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  return router;
}; 