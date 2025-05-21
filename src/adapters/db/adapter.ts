import { User, UserCreateInput, UserUpdateInput, Role, RoleCreateInput, RoleUpdateInput, CustomUserFields } from '../../models';

/**
 * Database adapter interface for AuthX
 * This interface defines the methods that each database implementation must provide
 */
export interface DbAdapter<T extends CustomUserFields = {}> {
  // User operations
  createUser(user: UserCreateInput<T>): Promise<User<T>>;
  getUserById(id: string): Promise<User<T> | null>;
  getUserByEmail(email: string): Promise<User<T> | null>;
  updateUser(id: string, data: UserUpdateInput<T>): Promise<User<T>>;
  deleteUser(id: string): Promise<boolean>;
  findAllUsers(): Promise<User<T>[]>;
  
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
  getUserByResetToken(token: string): Promise<User<T> | null>;
  getUserByVerificationToken(token: string): Promise<User<T> | null>;
  
  // Connection operations
  connect(): Promise<void>;
  disconnect(): Promise<void>;
} 