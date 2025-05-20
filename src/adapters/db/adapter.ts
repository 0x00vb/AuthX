import { User, UserCreateInput, UserUpdateInput, Role, RoleCreateInput, RoleUpdateInput } from '../../models';

/**
 * Database adapter interface for AuthX
 * This interface defines the methods that each database implementation must provide
 */
export interface DbAdapter {
  // User operations
  createUser(user: UserCreateInput): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, data: UserUpdateInput): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  
  // Role operations
  createRole(role: RoleCreateInput): Promise<Role>;
  getRoleById(id: string): Promise<Role | null>;
  getRoleByName(name: string): Promise<Role | null>;
  updateRole(id: string, data: RoleUpdateInput): Promise<Role>;
  deleteRole(id: string): Promise<boolean>;
  
  // User-Role operations
  assignRoleToUser(userId: string, roleId: string): Promise<boolean>;
  removeRoleFromUser(userId: string, roleId: string): Promise<boolean>;
  getUserRoles(userId: string): Promise<Role[]>;
  
  // Utility operations
  getUserByResetToken(token: string): Promise<User | null>;
  getUserByVerificationToken(token: string): Promise<User | null>;
  
  // Connection operations
  connect(): Promise<void>;
  disconnect(): Promise<void>;
} 