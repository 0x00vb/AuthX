import { body, param } from 'express-validator';

/**
 * Validation rules for user registration
 */
export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .optional()
    .isString()
    .withMessage('First name must be a string'),
  body('lastName')
    .optional()
    .isString()
    .withMessage('Last name must be a string'),
];

/**
 * Validation rules for user login
 */
export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('password')
    .exists()
    .withMessage('Password is required'),
];

/**
 * Validation rules for forgot password
 */
export const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
];

/**
 * Validation rules for reset password
 */
export const resetPasswordValidation = [
  body('token')
    .isString()
    .withMessage('Token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

/**
 * Validation rules for refresh token
 */
export const refreshTokenValidation = [
  body('refreshToken')
    .isString()
    .withMessage('Refresh token is required'),
];

/**
 * Validation rules for creating a role
 */
export const createRoleValidation = [
  body('name')
    .isString()
    .withMessage('Role name is required'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
];

/**
 * Validation rules for updating a role
 */
export const updateRoleValidation = [
  param('id')
    .isString()
    .withMessage('Role ID is required'),
  body('name')
    .optional()
    .isString()
    .withMessage('Role name must be a string'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
];

/**
 * Validation rules for role ID parameter
 */
export const roleIdParamValidation = [
  param('id')
    .isString()
    .withMessage('Role ID is required'),
];

/**
 * Validation rules for assigning a role
 */
export const assignRoleValidation = [
  body('userId')
    .isString()
    .withMessage('User ID is required'),
  body('roleId')
    .isString()
    .withMessage('Role ID is required'),
];

/**
 * Validation rules for user ID parameter
 */
export const userIdParamValidation = [
  param('userId')
    .isString()
    .withMessage('User ID is required'),
]; 