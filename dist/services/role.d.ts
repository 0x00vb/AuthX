import { AuthXConfig } from '../config/types';
import { DbAdapter } from '../adapters/db';
import { Role, RoleCreateInput, RoleUpdateInput } from '../models';
/**
 * Role service
 * Handles business logic for role operations
 */
export declare class RoleService {
    private config;
    private dbAdapter;
    constructor(config: AuthXConfig, dbAdapter: DbAdapter);
    /**
     * Create a new role
     * @param roleData Role creation data
     */
    createRole(roleData: RoleCreateInput): Promise<Role>;
    /**
     * Get role by ID
     * @param id Role ID
     */
    getRoleById(id: string): Promise<Role>;
    /**
     * Get role by name
     * @param name Role name
     */
    getRoleByName(name: string): Promise<Role>;
    /**
     * Update a role
     * @param id Role ID
     * @param data Role update data
     */
    updateRole(id: string, data: RoleUpdateInput): Promise<Role>;
    /**
     * Delete a role
     * @param id Role ID
     */
    deleteRole(id: string): Promise<boolean>;
    /**
     * Assign a role to a user
     * @param userId User ID
     * @param roleId Role ID
     */
    assignRoleToUser(userId: string, roleId: string): Promise<boolean>;
    /**
     * Remove a role from a user
     * @param userId User ID
     * @param roleId Role ID
     */
    removeRoleFromUser(userId: string, roleId: string): Promise<boolean>;
    /**
     * Get all roles for a user
     * @param userId User ID
     */
    getUserRoles(userId: string): Promise<Role[]>;
}
