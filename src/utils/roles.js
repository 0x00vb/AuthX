/**
 * Roles Utility
 * 
 * This file provides common role definitions and helper functions
 * for working with role-based access control (RBAC).
 */

// Common role definitions
const ROLES = {
  USER: 'user',          // Basic user with standard permissions
  ADMIN: 'admin',        // Administrator with full system access
  MODERATOR: 'moderator',// Moderator with elevated permissions
  GUEST: 'guest'         // Limited access for unauthenticated or restricted users
};

/**
 * Check if a user has a specific role
 * @param {Object} user - User object containing roles array
 * @param {String} role - Role to check
 * @returns {Boolean} True if user has the role
 */
const hasRole = (user, role) => {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return false;
  }
  return user.roles.includes(role);
};

/**
 * Check if a user has any of the specified roles
 * @param {Object} user - User object containing roles array
 * @param {Array} roles - Array of roles to check
 * @returns {Boolean} True if user has any of the roles
 */
const hasAnyRole = (user, roles) => {
  if (!user || !user.roles || !Array.isArray(user.roles) || !Array.isArray(roles)) {
    return false;
  }
  return roles.some(role => user.roles.includes(role));
};

/**
 * Check if a user has all of the specified roles
 * @param {Object} user - User object containing roles array
 * @param {Array} roles - Array of roles to check
 * @returns {Boolean} True if user has all of the roles
 */
const hasAllRoles = (user, roles) => {
  if (!user || !user.roles || !Array.isArray(user.roles) || !Array.isArray(roles)) {
    return false;
  }
  return roles.every(role => user.roles.includes(role));
};

/**
 * Add a role to a user
 * @param {Object} user - User object containing roles array
 * @param {String} role - Role to add
 * @returns {Object} User with updated roles
 */
const addRole = (user, role) => {
  if (!user) {
    return user;
  }
  
  if (!user.roles) {
    user.roles = [];
  }
  
  if (!user.roles.includes(role)) {
    user.roles.push(role);
  }
  
  return user;
};

/**
 * Remove a role from a user
 * @param {Object} user - User object containing roles array
 * @param {String} role - Role to remove
 * @returns {Object} User with updated roles
 */
const removeRole = (user, role) => {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return user;
  }
  
  user.roles = user.roles.filter(r => r !== role);
  
  return user;
};

module.exports = {
  ROLES,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  addRole,
  removeRole
}; 