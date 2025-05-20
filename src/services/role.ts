import { AuthXConfig } from '../config/types';
import { DbAdapter } from '../adapters/db';
import { Role, RoleCreateInput, RoleUpdateInput } from '../models';

/**
 * Role service
 * Handles business logic for role operations
 */
export class RoleService {
  private config: AuthXConfig;
  private dbAdapter: DbAdapter;
  
  constructor(config: AuthXConfig, dbAdapter: DbAdapter) {
    this.config = config;
    this.dbAdapter = dbAdapter;
  }
  
  /**
   * Create a new role
   * @param roleData Role creation data
   */
  public async createRole(roleData: RoleCreateInput): Promise<Role> {
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
  public async getRoleById(id: string): Promise<Role> {
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
  public async getRoleByName(name: string): Promise<Role> {
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
  public async updateRole(id: string, data: RoleUpdateInput): Promise<Role> {
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
  public async deleteRole(id: string): Promise<boolean> {
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
  public async assignRoleToUser(userId: string, roleId: string): Promise<boolean> {
    return this.dbAdapter.assignRoleToUser(userId, roleId);
  }
  
  /**
   * Remove a role from a user
   * @param userId User ID
   * @param roleId Role ID
   */
  public async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    return this.dbAdapter.removeRoleFromUser(userId, roleId);
  }
  
  /**
   * Get all roles for a user
   * @param userId User ID
   */
  public async getUserRoles(userId: string): Promise<Role[]> {
    return this.dbAdapter.getUserRoles(userId);
  }
} 