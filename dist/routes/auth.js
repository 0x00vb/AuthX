"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuthRoutes = setupAuthRoutes;
const controllers_1 = require("../controllers");
const services_1 = require("../services");
const middleware_1 = require("../middleware");
const validation_1 = require("../utils/validation");
/**
 * Setup authentication routes
 * @param router Express router
 * @param config AuthX configuration
 * @param dbAdapter Database adapter
 */
function setupAuthRoutes(router, config, dbAdapter) {
    // Create services
    const authService = new services_1.AuthService(config, dbAdapter);
    // Create controllers
    const authController = new controllers_1.AuthController(authService);
    // Create middleware
    const authMiddleware = new middleware_1.AuthXMiddleware(config, dbAdapter);
    // Register routes
    router.post('/register', validation_1.registerValidation, authController.register);
    router.post('/login', validation_1.loginValidation, authController.login);
    router.post('/forgot-password', validation_1.forgotPasswordValidation, authController.forgotPassword);
    router.post('/reset-password', validation_1.resetPasswordValidation, authController.resetPassword);
    router.post('/refresh-token', validation_1.refreshTokenValidation, authController.refreshToken);
    router.get('/me', authMiddleware.authenticate({ throwError: true }), authController.getMe);
}
//# sourceMappingURL=auth.js.map