import { DbAdapter } from '../../src/adapters/db/adapter';
import { User, UserCreateInput, UserUpdateInput, Role, RoleCreateInput, RoleUpdateInput } from '../../src/models';
import bcrypt from 'bcrypt';

export class MockDbAdapter implements DbAdapter {
  private users: Map<string, User> = new Map();
  private roles: Map<string, Role> = new Map();
  private nextUserId = 1;
  private nextRoleId = 1;

  async connect(): Promise<void> {
    // No-op
  }

  async disconnect(): Promise<void> {
    // No-op
  }

  // User operations
  async createUser(userData: UserCreateInput): Promise<User> {
    const id = String(this.nextUserId++);
    const now = new Date();
    
    const newUser: User = {
      id,
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      roles: userData.roles || ['user'],
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    
    this.users.set(id, newUser);
    
    return { ...newUser };
  }

  async getUserById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    return user ? { ...user } : null;
  }

  async updateUser(id: string, userData: UserUpdateInput): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = {
      ...user,
      ...userData,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    
    return { ...updatedUser };
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Role operations
  async createRole(roleData: RoleCreateInput): Promise<Role> {
    const id = String(this.nextRoleId++);
    const now = new Date();
    
    const newRole: Role = {
      id,
      name: roleData.name,
      description: roleData.description || '',
      permissions: roleData.permissions || [],
      createdAt: now,
      updatedAt: now
    };
    
    this.roles.set(id, newRole);
    
    return { ...newRole };
  }

  async getRoleById(id: string): Promise<Role | null> {
    const role = this.roles.get(id);
    return role ? { ...role } : null;
  }

  async getRoleByName(name: string): Promise<Role | null> {
    const role = Array.from(this.roles.values()).find(r => r.name === name);
    return role ? { ...role } : null;
  }

  async updateRole(id: string, roleData: RoleUpdateInput): Promise<Role> {
    const role = this.roles.get(id);
    if (!role) {
      throw new Error('Role not found');
    }
    
    const updatedRole = {
      ...role,
      ...roleData,
      updatedAt: new Date()
    };
    
    this.roles.set(id, updatedRole);
    
    return { ...updatedRole };
  }

  async deleteRole(id: string): Promise<boolean> {
    return this.roles.delete(id);
  }

  // User-Role operations
  async assignRoleToUser(userId: string, roleId: string): Promise<boolean> {
    const user = this.users.get(userId);
    const role = this.roles.get(roleId);
    
    if (!user || !role) {
      return false;
    }
    
    if (!user.roles.includes(role.name)) {
      user.roles.push(role.name);
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
    
    return true;
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    const user = this.users.get(userId);
    const role = this.roles.get(roleId);
    
    if (!user || !role) {
      return false;
    }
    
    if (user.roles.includes(role.name)) {
      user.roles = user.roles.filter(r => r !== role.name);
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
    
    return true;
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const user = this.users.get(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const userRoles = user.roles.map(roleName => {
      const role = Array.from(this.roles.values()).find(r => r.name === roleName);
      if (!role) {
        throw new Error(`Role not found: ${roleName}`);
      }
      return { ...role };
    });
    
    return userRoles;
  }

  // Utility operations
  async getUserByResetToken(token: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(u => 
      u.resetPasswordToken === token && 
      u.resetPasswordExpires && 
      u.resetPasswordExpires > new Date()
    );
    
    return user ? { ...user } : null;
  }

  async getUserByVerificationToken(token: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(u => u.verificationToken === token);
    return user ? { ...user } : null;
  }
} 