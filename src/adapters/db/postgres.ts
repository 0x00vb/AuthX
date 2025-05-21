import { AuthXConfig } from '../../config/types';
import { User, UserCreateInput, UserUpdateInput, Role, RoleCreateInput, RoleUpdateInput, CustomUserFields } from '../../models';
import { DbAdapter } from './adapter';
import { Pool, PoolClient } from 'pg';

/**
 * PostgreSQL adapter implementation
 */
export class PostgresAdapter<T extends CustomUserFields = {}> implements DbAdapter<T> {
  private config: AuthXConfig;
  private pool: Pool | null = null;
  
  constructor(config: AuthXConfig) {
    this.config = config;
  }
  
  /**
   * Connect to PostgreSQL database
   */
  async connect(): Promise<void> {
    try {
      this.pool = new Pool({
        connectionString: this.config.dbUri,
      });
      
      // Test the connection
      const client = await this.pool.connect();
      client.release();
      
      // Initialize tables if they don't exist
      await this.initializeTables();
      
      console.log('Connected to PostgreSQL');
    } catch (error) {
      console.error('PostgreSQL connection error:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from PostgreSQL database
   */
  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Disconnected from PostgreSQL');
    }
  }
  
  /**
   * Initialize tables if they don't exist
   */
  private async initializeTables(): Promise<void> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          roles TEXT[] NOT NULL DEFAULT '{"user"}',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          verification_token VARCHAR(255),
          reset_password_token VARCHAR(255),
          reset_password_expires TIMESTAMP,
          last_login TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Create roles table
      await client.query(`
        CREATE TABLE IF NOT EXISTS roles (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          permissions TEXT[] NOT NULL DEFAULT '{}',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_password_token)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name)');
      
      // Create default roles if they don't exist
      const defaultRoles = ['user', 'admin'];
      for (const role of defaultRoles) {
        await client.query(
          'INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [role]
        );
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error initializing tables:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get a client from the pool
   */
  private async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      await this.connect();
    }
    return this.pool!.connect();
  }
  
  // User operations
  
  /**
   * Create a new user
   */
  async createUser(userData: UserCreateInput): Promise<User> {
    const client = await this.getClient();
    
    try {
      const { email, password, firstName, lastName, roles } = userData;
      const defaultRoles = roles || [this.config.defaultRole];
      
      const result = await client.query(
        `INSERT INTO users (email, password, first_name, last_name, roles) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [email, password, firstName, lastName, defaultRoles]
      );
      
      return this.mapUserFromDb(result.rows[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    const client = await this.getClient();
    
    try {
      // Convert string ID to number if needed
      const numericId = isNaN(Number(id)) ? id : Number(id);
      
      const result = await client.query('SELECT * FROM users WHERE id = $1', [numericId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapUserFromDb(result.rows[0]);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const client = await this.getClient();
    
    try {
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapUserFromDb(result.rows[0]);
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Find all users in the system
   */
  async findAllUsers(): Promise<User[]> {
    const client = await this.getClient();
    
    try {
      const result = await client.query('SELECT * FROM users ORDER BY created_at DESC');
      
      return result.rows.map(row => this.mapUserFromDb(row));
    } catch (error) {
      console.error('Error finding all users:', error);
      return [];
    } finally {
      client.release();
    }
  }
  
  /**
   * Update user
   */
  async updateUser(id: string, userData: UserUpdateInput): Promise<User> {
    const client = await this.getClient();
    
    try {
      // Convert string ID to number if needed
      const numericId = isNaN(Number(id)) ? id : Number(id);
      
      // Build the SET part of the query dynamically based on userData
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (userData.email !== undefined) {
        updates.push(`email = $${paramIndex}`);
        values.push(userData.email);
        paramIndex++;
      }
      
      if (userData.password !== undefined) {
        updates.push(`password = $${paramIndex}`);
        values.push(userData.password);
        paramIndex++;
      }
      
      if (userData.firstName !== undefined) {
        updates.push(`first_name = $${paramIndex}`);
        values.push(userData.firstName);
        paramIndex++;
      }
      
      if (userData.lastName !== undefined) {
        updates.push(`last_name = $${paramIndex}`);
        values.push(userData.lastName);
        paramIndex++;
      }
      
      if (userData.roles !== undefined) {
        updates.push(`roles = $${paramIndex}`);
        values.push(userData.roles);
        paramIndex++;
      }
      
      if (userData.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(userData.isActive);
        paramIndex++;
      }
      
      if (userData.verificationToken !== undefined) {
        updates.push(`verification_token = $${paramIndex}`);
        values.push(userData.verificationToken);
        paramIndex++;
      }
      
      if (userData.resetPasswordToken !== undefined) {
        updates.push(`reset_password_token = $${paramIndex}`);
        values.push(userData.resetPasswordToken);
        paramIndex++;
      }
      
      if (userData.resetPasswordExpires !== undefined) {
        updates.push(`reset_password_expires = $${paramIndex}`);
        values.push(userData.resetPasswordExpires);
        paramIndex++;
      }
      
      if (userData.lastLogin !== undefined) {
        updates.push(`last_login = $${paramIndex}`);
        values.push(userData.lastLogin);
        paramIndex++;
      }
      
      // Always update updated_at
      updates.push(`updated_at = $${paramIndex}`);
      values.push(new Date());
      paramIndex++;
      
      // Add ID to values
      values.push(numericId);
      
      // If no updates to make, get the current user
      if (updates.length === 0) {
        return (await this.getUserById(id))!;
      }
      
      const updateQuery = `
        UPDATE users 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, values);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return this.mapUserFromDb(result.rows[0]);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<boolean> {
    const client = await this.getClient();
    
    try {
      // Convert string ID to number if needed
      const numericId = isNaN(Number(id)) ? id : Number(id);
      
      const result = await client.query('DELETE FROM users WHERE id = $1', [numericId]);
      return result.rowCount === 1;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    } finally {
      client.release();
    }
  }
  
  // Role operations
  
  /**
   * Create a new role
   */
  async createRole(roleData: RoleCreateInput): Promise<Role> {
    const client = await this.getClient();
    
    try {
      const { name, description, permissions } = roleData;
      const permissionsArray = permissions || [];
      
      const result = await client.query(
        `INSERT INTO roles (name, description, permissions) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [name, description, permissionsArray]
      );
      
      return this.mapRoleFromDb(result.rows[0]);
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<Role | null> {
    const client = await this.getClient();
    
    try {
      // Convert string ID to number if needed
      const numericId = isNaN(Number(id)) ? id : Number(id);
      
      const result = await client.query('SELECT * FROM roles WHERE id = $1', [numericId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRoleFromDb(result.rows[0]);
    } catch (error) {
      console.error('Error getting role by ID:', error);
      return null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get role by name
   */
  async getRoleByName(name: string): Promise<Role | null> {
    const client = await this.getClient();
    
    try {
      const result = await client.query('SELECT * FROM roles WHERE name = $1', [name]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRoleFromDb(result.rows[0]);
    } catch (error) {
      console.error('Error getting role by name:', error);
      return null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Update role
   */
  async updateRole(id: string, roleData: RoleUpdateInput): Promise<Role> {
    const client = await this.getClient();
    
    try {
      // Convert string ID to number if needed
      const numericId = isNaN(Number(id)) ? id : Number(id);
      
      // Build the SET part of the query dynamically based on roleData
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (roleData.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(roleData.name);
        paramIndex++;
      }
      
      if (roleData.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(roleData.description);
        paramIndex++;
      }
      
      if (roleData.permissions !== undefined) {
        updates.push(`permissions = $${paramIndex}`);
        values.push(roleData.permissions);
        paramIndex++;
      }
      
      // Always update updated_at
      updates.push(`updated_at = $${paramIndex}`);
      values.push(new Date());
      paramIndex++;
      
      // Add ID to values
      values.push(numericId);
      
      const updateQuery = `
        UPDATE roles 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, values);
      
      if (result.rows.length === 0) {
        throw new Error('Role not found');
      }
      
      return this.mapRoleFromDb(result.rows[0]);
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Delete role
   */
  async deleteRole(id: string): Promise<boolean> {
    const client = await this.getClient();
    
    try {
      // Convert string ID to number if needed
      const numericId = isNaN(Number(id)) ? id : Number(id);
      
      const result = await client.query('DELETE FROM roles WHERE id = $1', [numericId]);
      return result.rowCount === 1;
    } catch (error) {
      console.error('Error deleting role:', error);
      return false;
    } finally {
      client.release();
    }
  }
  
  // User-Role operations
  
  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<boolean> {
    const client = await this.getClient();
    
    try {
      // Convert string IDs to numbers if needed
      const numericUserId = isNaN(Number(userId)) ? userId : Number(userId);
      const numericRoleId = isNaN(Number(roleId)) ? roleId : Number(roleId);
      
      // Get user and role
      const user = await this.getUserById(userId);
      const role = await this.getRoleById(roleId);
      
      if (!user || !role) {
        return false;
      }
      
      // Check if user already has the role
      if (user.roles.includes(role.name)) {
        return true; // Already has the role
      }
      
      // Add role to user
      const updatedRoles = [...user.roles, role.name];
      
      await client.query(
        'UPDATE users SET roles = $1, updated_at = $2 WHERE id = $3',
        [updatedRoles, new Date(), numericUserId]
      );
      
      return true;
    } catch (error) {
      console.error('Error assigning role to user:', error);
      return false;
    } finally {
      client.release();
    }
  }
  
  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    const client = await this.getClient();
    
    try {
      // Convert string IDs to numbers if needed
      const numericUserId = isNaN(Number(userId)) ? userId : Number(userId);
      const numericRoleId = isNaN(Number(roleId)) ? roleId : Number(roleId);
      
      // Get user and role
      const user = await this.getUserById(userId);
      const role = await this.getRoleById(roleId);
      
      if (!user || !role) {
        return false;
      }
      
      // Check if user has the role
      if (!user.roles.includes(role.name)) {
        return true; // Already doesn't have the role
      }
      
      // Remove role from user
      const updatedRoles = user.roles.filter(r => r !== role.name);
      
      await client.query(
        'UPDATE users SET roles = $1, updated_at = $2 WHERE id = $3',
        [updatedRoles, new Date(), numericUserId]
      );
      
      return true;
    } catch (error) {
      console.error('Error removing role from user:', error);
      return false;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const client = await this.getClient();
    
    try {
      // Convert string ID to number if needed
      const numericUserId = isNaN(Number(userId)) ? userId : Number(userId);
      
      // Get user
      const userResult = await client.query('SELECT roles FROM users WHERE id = $1', [numericUserId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const roleNames = userResult.rows[0].roles;
      
      // Get roles
      const rolesResult = await client.query(
        'SELECT * FROM roles WHERE name = ANY($1)',
        [roleNames]
      );
      
      return rolesResult.rows.map(this.mapRoleFromDb);
    } catch (error) {
      console.error('Error getting user roles:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Utility operations
  
  /**
   * Get user by reset token
   */
  async getUserByResetToken(token: string): Promise<User | null> {
    const client = await this.getClient();
    
    try {
      const result = await client.query(
        `SELECT * FROM users 
         WHERE reset_password_token = $1 
         AND reset_password_expires > $2`,
        [token, new Date()]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapUserFromDb(result.rows[0]);
    } catch (error) {
      console.error('Error getting user by reset token:', error);
      return null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get user by verification token
   */
  async getUserByVerificationToken(token: string): Promise<User | null> {
    const client = await this.getClient();
    
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE verification_token = $1',
        [token]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapUserFromDb(result.rows[0]);
    } catch (error) {
      console.error('Error getting user by verification token:', error);
      return null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Map DB user to User model
   */
  private mapUserFromDb(dbUser: any): User {
    return {
      id: dbUser.id.toString(),
      email: dbUser.email,
      password: dbUser.password,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      roles: dbUser.roles,
      isActive: dbUser.is_active,
      verificationToken: dbUser.verification_token,
      resetPasswordToken: dbUser.reset_password_token,
      resetPasswordExpires: dbUser.reset_password_expires,
      lastLogin: dbUser.last_login,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at
    };
  }
  
  /**
   * Map DB role to Role model
   */
  private mapRoleFromDb(dbRole: any): Role {
    return {
      id: dbRole.id.toString(),
      name: dbRole.name,
      description: dbRole.description,
      permissions: dbRole.permissions,
      createdAt: dbRole.created_at,
      updatedAt: dbRole.updated_at
    };
  }
} 