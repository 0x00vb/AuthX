"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIdParamValidation = exports.assignRoleValidation = exports.roleIdParamValidation = exports.updateRoleValidation = exports.createRoleValidation = exports.refreshTokenValidation = exports.resetPasswordValidation = exports.forgotPasswordValidation = exports.loginValidation = exports.registerValidation = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation rules for user registration
 */
exports.registerValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Valid email is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('firstName')
        .optional()
        .isString()
        .withMessage('First name must be a string'),
    (0, express_validator_1.body)('lastName')
        .optional()
        .isString()
        .withMessage('Last name must be a string'),
];
/**
 * Validation rules for user login
 */
exports.loginValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Valid email is required'),
    (0, express_validator_1.body)('password')
        .exists()
        .withMessage('Password is required'),
];
/**
 * Validation rules for forgot password
 */
exports.forgotPasswordValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Valid email is required'),
];
/**
 * Validation rules for reset password
 */
exports.resetPasswordValidation = [
    (0, express_validator_1.body)('token')
        .isString()
        .withMessage('Token is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
];
/**
 * Validation rules for refresh token
 */
exports.refreshTokenValidation = [
    (0, express_validator_1.body)('refreshToken')
        .isString()
        .withMessage('Refresh token is required'),
];
/**
 * Validation rules for creating a role
 */
exports.createRoleValidation = [
    (0, express_validator_1.body)('name')
        .isString()
        .withMessage('Role name is required'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .withMessage('Description must be a string'),
    (0, express_validator_1.body)('permissions')
        .optional()
        .isArray()
        .withMessage('Permissions must be an array'),
];
/**
 * Validation rules for updating a role
 */
exports.updateRoleValidation = [
    (0, express_validator_1.param)('id')
        .isString()
        .withMessage('Role ID is required'),
    (0, express_validator_1.body)('name')
        .optional()
        .isString()
        .withMessage('Role name must be a string'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .withMessage('Description must be a string'),
    (0, express_validator_1.body)('permissions')
        .optional()
        .isArray()
        .withMessage('Permissions must be an array'),
];
/**
 * Validation rules for role ID parameter
 */
exports.roleIdParamValidation = [
    (0, express_validator_1.param)('id')
        .isString()
        .withMessage('Role ID is required'),
];
/**
 * Validation rules for assigning a role
 */
exports.assignRoleValidation = [
    (0, express_validator_1.body)('userId')
        .isString()
        .withMessage('User ID is required'),
    (0, express_validator_1.body)('roleId')
        .isString()
        .withMessage('Role ID is required'),
];
/**
 * Validation rules for user ID parameter
 */
exports.userIdParamValidation = [
    (0, express_validator_1.param)('userId')
        .isString()
        .withMessage('User ID is required'),
];
//# sourceMappingURL=validation.js.map