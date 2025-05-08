/**
 * Input validation utilities
 */
const { body, validationResult } = require('express-validator');
const { ValidationError } = require('./errors');

/**
 * Registration validation rules
 * @returns {Array} - Express-validator validation rules
 */
const registerValidationRules = () => [
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('name')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long')
    .trim()
];

/**
 * Login validation rules
 * @returns {Array} - Express-validator validation rules
 */
const loginValidationRules = () => [
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Password reset validation rules
 * @returns {Array} - Express-validator validation rules
 */
const passwordResetValidationRules = () => [
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
];

/**
 * New password validation rules
 * @returns {Array} - Express-validator validation rules
 */
const newPasswordValidationRules = () => [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

/**
 * Email verification validation rules
 * @returns {Array} - Express-validator validation rules
 */
const emailVerificationValidationRules = () => [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
];

/**
 * Role validation rules
 * @returns {Array} - Express-validator validation rules
 */
const roleValidationRules = () => [
  body('role')
    .isIn(['user', 'admin', 'moderator'])
    .withMessage('Invalid role')
];

/**
 * Validate request using the specified rules
 * @returns {Function} - Express middleware function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = errors.array().map(err => ({
    field: err.path,
    message: err.msg
  }));
  
  next(new ValidationError(extractedErrors));
};

module.exports = {
  registerValidationRules,
  loginValidationRules,
  passwordResetValidationRules,
  newPasswordValidationRules,
  emailVerificationValidationRules,
  roleValidationRules,
  validate
}; 