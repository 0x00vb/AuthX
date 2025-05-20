"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const express_validator_1 = require("express-validator");
/**
 * Authentication controller
 * Handles HTTP requests for authentication operations
 */
class AuthController {
    constructor(authService) {
        /**
         * Register a new user
         */
        this.register = async (req, res) => {
            try {
                // Validate request
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({ errors: errors.array() });
                    return;
                }
                const { email, password, firstName, lastName } = req.body;
                // Register user
                const { user, token } = await this.authService.register({
                    email,
                    password,
                    firstName,
                    lastName,
                });
                // Remove password from response
                const userResponse = { ...user, password: undefined };
                res.status(201).json({ user: userResponse, token });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'An error occurred during registration';
                res.status(400).json({ message });
            }
        };
        /**
         * Log in a user
         */
        this.login = async (req, res) => {
            try {
                // Validate request
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({ errors: errors.array() });
                    return;
                }
                const { email, password } = req.body;
                // Login user
                const { user, token, refreshToken } = await this.authService.login(email, password);
                // Remove password from response
                const userResponse = { ...user, password: undefined };
                res.status(200).json({ user: userResponse, token, refreshToken });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'An error occurred during login';
                res.status(401).json({ message });
            }
        };
        /**
         * Get the current user
         */
        this.getMe = async (req, res) => {
            try {
                if (!req.user) {
                    res.status(401).json({ message: 'Not authenticated' });
                    return;
                }
                // Remove password from response
                const userResponse = { ...req.user, password: undefined };
                res.status(200).json({ user: userResponse });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'An error occurred';
                res.status(500).json({ message });
            }
        };
        /**
         * Request password reset
         */
        this.forgotPassword = async (req, res) => {
            try {
                // Validate request
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({ errors: errors.array() });
                    return;
                }
                const { email } = req.body;
                // Request password reset
                const { resetToken } = await this.authService.forgotPassword(email);
                // Here you would typically send an email with the reset token
                // This is just a placeholder for demonstration
                res.status(200).json({ message: 'Password reset email sent' });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'An error occurred';
                res.status(400).json({ message });
            }
        };
        /**
         * Reset password
         */
        this.resetPassword = async (req, res) => {
            try {
                // Validate request
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({ errors: errors.array() });
                    return;
                }
                const { token, password } = req.body;
                // Reset password
                await this.authService.resetPassword(token, password);
                res.status(200).json({ message: 'Password reset successful' });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'An error occurred';
                res.status(400).json({ message });
            }
        };
        /**
         * Refresh access token
         */
        this.refreshToken = async (req, res) => {
            try {
                // Validate request
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({ errors: errors.array() });
                    return;
                }
                const { refreshToken } = req.body;
                // Refresh token
                const tokens = await this.authService.refreshToken(refreshToken);
                res.status(200).json(tokens);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'An error occurred';
                res.status(401).json({ message });
            }
        };
        this.authService = authService;
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.js.map