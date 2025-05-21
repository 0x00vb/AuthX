import { AuthXConfig } from '../../config/types';
import { User, UserCreateInput, UserUpdateInput, Role, RoleCreateInput, RoleUpdateInput } from '../../models';
import { DbAdapter } from './adapter';
/**
 * MySQL adapter implementation
 */
export declare class MySqlAdapter implements DbAdapter {
    private config;
    private pool;
    constructor(config: AuthXConfig);
    /**
     * Connect to MySQL database
     */
    connect(): Promise<void>;
    /**
     * Disconnect from MySQL database
     */
    disconnect(): Promise<void>;
    /**
     * Initialize tables if they don't exist
     */
    private initializeTables;
    /**
     * Create a new user
     */
    createUser(userData: UserCreateInput): Promise<User>;
    /**
     * Get user by ID
     */
    getUserById(id: string): Promise<User | null>;
    /**
     * Get user by email
     */
    getUserByEmail(email: string): Promise<User | null>;
    /**
     * Update user
     */
    updateUser(id: string, userData: UserUpdateInput): Promise<User>;
    /**
     * Delete user
     */
    deleteUser(id: string): Promise<boolean>;
    /**
     * Find all users in the system
     */
    findAllUsers(): Promise<User[]>;
    /**
     * Create a new role
     */
    createRole(roleData: RoleCreateInput): Promise<Role>;
    /**
     * Get role by ID
     */
    getRoleById(id: string): Promise<Role | null>;
    /**
     * Get role by name
     */
    getRoleByName(name: string): Promise<Role | null>;
    /**
     * Update role
     */
    updateRole(id: string, roleData: RoleUpdateInput): Promise<Role>;
    /**
     * Delete role
     */
    deleteRole(id: string): Promise<boolean>;
    /**
     * Assign role to user
     */
    assignRoleToUser(userId: string, roleId: string): Promise<boolean>;
    /**
     * Remove role from user
     */
    removeRoleFromUser(userId: string, roleId: string): Promise<boolean>;
    /**
     * Get user roles
     */
    getUserRoles(userId: string): Promise<Role[]>;
    /**
     * Get user by reset token
     */
    getUserByResetToken(token: string): Promise<User | null>;
    /**
     * Get user by verification token
     */
    getUserByVerificationToken(token: string): Promise<User | null>;
    /**
     * Map DB user to User model
     */
    private mapUserFromDb;
    /**
     * Map DB role to Role model
     */
    private mapRoleFromDb;
}
