"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
/**
 * Role service
 * Handles business logic for role operations
 */
class RoleService {
    constructor(config, dbAdapter) {
        this.config = config;
        this.dbAdapter = dbAdapter;
    }
    /**
     * Create a new role
     * @param roleData Role creation data
     */
    async createRole(roleData) {
        // Check if role already exists
        const existingRole = await this.dbAdapter.getRoleByName(roleData.name);
        if (existingRole) {
            throw new Error('Role already exists');
        }
        return this.dbAdapter.createRole(roleData);
    }
    /**
     * Get role by ID
     * @param id Role ID
     */
    async getRoleById(id) {
        const role = await this.dbAdapter.getRoleById(id);
        if (!role) {
            throw new Error('Role not found');
        }
        return role;
    }
    /**
     * Get role by name
     * @param name Role name
     */
    async getRoleByName(name) {
        const role = await this.dbAdapter.getRoleByName(name);
        if (!role) {
            throw new Error('Role not found');
        }
        return role;
    }
    /**
     * Update a role
     * @param id Role ID
     * @param data Role update data
     */
    async updateRole(id, data) {
        // Check if role exists
        const role = await this.dbAdapter.getRoleById(id);
        if (!role) {
            throw new Error('Role not found');
        }
        // If name is being updated, check if it conflicts with an existing role
        if (data.name && data.name !== role.name) {
            const existingRole = await this.dbAdapter.getRoleByName(data.name);
            if (existingRole && existingRole.id !== id) {
                throw new Error('Role name already in use');
            }
        }
        return this.dbAdapter.updateRole(id, data);
    }
    /**
     * Delete a role
     * @param id Role ID
     */
    async deleteRole(id) {
        // Check if role exists
        const role = await this.dbAdapter.getRoleById(id);
        if (!role) {
            throw new Error('Role not found');
        }
        return this.dbAdapter.deleteRole(id);
    }
    /**
     * Assign a role to a user
     * @param userId User ID
     * @param roleId Role ID
     */
    async assignRoleToUser(userId, roleId) {
        return this.dbAdapter.assignRoleToUser(userId, roleId);
    }
    /**
     * Remove a role from a user
     * @param userId User ID
     * @param roleId Role ID
     */
    async removeRoleFromUser(userId, roleId) {
        return this.dbAdapter.removeRoleFromUser(userId, roleId);
    }
    /**
     * Get all roles for a user
     * @param userId User ID
     */
    async getUserRoles(userId) {
        return this.dbAdapter.getUserRoles(userId);
    }
}
exports.RoleService = RoleService;
//# sourceMappingURL=role.js.map