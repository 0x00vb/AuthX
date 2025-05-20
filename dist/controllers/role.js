"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleController = void 0;
const express_validator_1 = require("express-validator");
/**
 * Role controller
 * Handles HTTP requests for role operations
 */
class RoleController {
    constructor(roleService) {
        /**
         * Create a new role
         */
        this.createRole = async (req, res) => {
            try {
                // Validate request
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({ errors: errors.array() });
                    return;
                }
                const { name, description, permissions } = req.body;
                // Create role
                const role = await this.roleService.createRole({
                    name,
                    description,
                    permissions,
                });
                res.status(201).json(role);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'An error occurred';
                if (message === 'Role already exists') {
                    res.status(400).json({ message });
                }
                else {
                    res.status(500).json({ message });
                }
            }
        };
        /**
         * Get role by ID
         */
        this.getRoleById = async (req, res) => {
            try {
                const { id } = req.params;
                const role = await this.roleService.getRoleById(id);
                res.status(200).json(role);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'An error occurred';
                if (message === 'Role not found') {
                    res.status(404).json({ message });
                }
                else {
                    res.status(500).json({ message });
                }
            }
        };
        /**
         * Update role
         */
        this.updateRole = async (req, res) => {
            try {
                // Validate request
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({ errors: errors.array() });
                    return;
                }
                const { id } = req.params;
                const { name, description, permissions } = req.body;
                // Update role
                const role = await this.roleService.updateRole(id, {
                    name,
                    description,
                    permissions,
                });
                res.status(200).json(role);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'An error occurred';
                if (message === 'Role not found') {
                    res.status(404).json({ message });
                }
                else if (message === 'Role name already in use') {
                    res.status(400).json({ message });
                }
                else {
                    res.status(500).json({ message });
                }
            }
        };
        /**
         * Delete role
         */
        this.deleteRole = async (req, res) => {
            try {
                const { id } = req.params;
                const success = await this.roleService.deleteRole(id);
                if (success) {
                    res.status(200).json({ message: 'Role deleted successfully' });
                }
                else {
                    res.status(500).json({ message: 'Failed to delete role' });
                }
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'An error occurred';
                if (message === 'Role not found') {
                    res.status(404).json({ message });
                }
                else {
                    res.status(500).json({ message });
                }
            }
        };
        /**
         * Assign role to user
         */
        this.assignRoleToUser = async (req, res) => {
            try {
                const { userId, roleId } = req.body;
                const success = await this.roleService.assignRoleToUser(userId, roleId);
                if (success) {
                    res.status(200).json({ message: 'Role assigned successfully' });
                }
                else {
                    res.status(500).json({ message: 'Failed to assign role' });
                }
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'An error occurred';
                res.status(500).json({ message });
            }
        };
        /**
         * Remove role from user
         */
        this.removeRoleFromUser = async (req, res) => {
            try {
                const { userId, roleId } = req.body;
                const success = await this.roleService.removeRoleFromUser(userId, roleId);
                if (success) {
                    res.status(200).json({ message: 'Role removed successfully' });
                }
                else {
                    res.status(500).json({ message: 'Failed to remove role' });
                }
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'An error occurred';
                res.status(500).json({ message });
            }
        };
        /**
         * Get user roles
         */
        this.getUserRoles = async (req, res) => {
            try {
                const { userId } = req.params;
                const roles = await this.roleService.getUserRoles(userId);
                res.status(200).json(roles);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'An error occurred';
                if (message.includes('User not found')) {
                    res.status(404).json({ message: 'User not found' });
                }
                else if (message.includes('Role not found')) {
                    res.status(500).json({ message: 'One or more roles not found' });
                }
                else {
                    res.status(500).json({ message });
                }
            }
        };
        this.roleService = roleService;
    }
}
exports.RoleController = RoleController;
//# sourceMappingURL=role.js.map