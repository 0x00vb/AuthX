"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlAdapter = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
/**
 * MySQL adapter implementation
 */
class MySqlAdapter {
    constructor(config) {
        this.pool = null;
        this.config = config;
    }
    /**
     * Connect to MySQL database
     */
    async connect() {
        try {
            this.pool = promise_1.default.createPool(this.config.dbUri);
            // Initialize tables if they don't exist
            await this.initializeTables();
            console.log('Connected to MySQL');
        }
        catch (error) {
            console.error('MySQL connection error:', error);
            throw error;
        }
    }
    /**
     * Disconnect from MySQL database
     */
    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            console.log('Disconnected from MySQL');
        }
    }
    /**
     * Initialize tables if they don't exist
     */
    async initializeTables() {
        if (!this.pool) {
            await this.connect();
        }
        try {
            // Create users table
            await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          roles JSON NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          verification_token VARCHAR(255),
          reset_password_token VARCHAR(255),
          reset_password_expires DATETIME,
          last_login DATETIME,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_reset_token (reset_password_token),
          INDEX idx_verification_token (verification_token)
        )
      `);
            // Create roles table
            await this.pool.query(`
        CREATE TABLE IF NOT EXISTS roles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          permissions JSON NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_name (name)
        )
      `);
            // Create default roles if they don't exist
            const defaultRoles = ['user', 'admin'];
            for (const role of defaultRoles) {
                await this.pool.query('INSERT IGNORE INTO roles (name, permissions) VALUES (?, ?)', [role, JSON.stringify([])]);
            }
        }
        catch (error) {
            console.error('Error initializing tables:', error);
            throw error;
        }
    }
    // User operations
    /**
     * Create a new user
     */
    async createUser(userData) {
        if (!this.pool) {
            await this.connect();
        }
        const now = new Date();
        const userRoles = userData.roles || [this.config.defaultRole];
        const [result] = await this.pool.execute(`INSERT INTO users 
       (email, password, first_name, last_name, roles, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            userData.email,
            userData.password,
            userData.firstName,
            userData.lastName,
            JSON.stringify(userRoles),
            1, // isActive as number
            now,
            now
        ]);
        // Get the created user with the insertId
        const [users] = await this.pool.query(`SELECT * FROM users WHERE id = ?`, [result.insertId]);
        if (users.length === 0) {
            throw new Error('User not found after creation');
        }
        return this.mapUserFromDb(users[0]);
    }
    /**
     * Get user by ID
     */
    async getUserById(id) {
        if (!this.pool) {
            await this.connect();
        }
        try {
            const [rows] = await this.pool.query('SELECT * FROM users WHERE id = ?', [parseInt(id)]);
            if (rows.length === 0) {
                return null;
            }
            return this.mapUserFromDb(rows[0]);
        }
        catch (error) {
            console.error('Error getting user by ID:', error);
            return null;
        }
    }
    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        if (!this.pool) {
            await this.connect();
        }
        try {
            const [rows] = await this.pool.query('SELECT * FROM users WHERE email = ?', [email]);
            if (rows.length === 0) {
                return null;
            }
            return this.mapUserFromDb(rows[0]);
        }
        catch (error) {
            console.error('Error getting user by email:', error);
            return null;
        }
    }
    /**
     * Update user
     */
    async updateUser(id, userData) {
        if (!this.pool) {
            await this.connect();
        }
        try {
            // Build the SET part of the query dynamically based on userData
            const updates = [];
            const values = [];
            if (userData.email !== undefined) {
                updates.push('email = ?');
                values.push(userData.email);
            }
            if (userData.password !== undefined) {
                updates.push('password = ?');
                values.push(userData.password);
            }
            if (userData.firstName !== undefined) {
                updates.push('first_name = ?');
                values.push(userData.firstName);
            }
            if (userData.lastName !== undefined) {
                updates.push('last_name = ?');
                values.push(userData.lastName);
            }
            if (userData.roles !== undefined) {
                updates.push('roles = ?');
                values.push(JSON.stringify(userData.roles));
            }
            if (userData.isActive !== undefined) {
                updates.push('is_active = ?');
                values.push(userData.isActive);
            }
            if (userData.verificationToken !== undefined) {
                updates.push('verification_token = ?');
                values.push(userData.verificationToken);
            }
            if (userData.resetPasswordToken !== undefined) {
                updates.push('reset_password_token = ?');
                values.push(userData.resetPasswordToken);
            }
            if (userData.resetPasswordExpires !== undefined) {
                updates.push('reset_password_expires = ?');
                values.push(userData.resetPasswordExpires);
            }
            if (userData.lastLogin !== undefined) {
                updates.push('last_login = ?');
                values.push(userData.lastLogin);
            }
            // Add ID to values
            values.push(id);
            if (updates.length === 0) {
                // No updates to make, get the current user
                return (await this.getUserById(id));
            }
            const updateQuery = `
        UPDATE users 
        SET ${updates.join(', ')} 
        WHERE id = ?
      `;
            await this.pool.query(updateQuery, values);
            // Get the updated user
            const updatedUser = await this.getUserById(id);
            if (!updatedUser) {
                throw new Error('User not found after update');
            }
            return updatedUser;
        }
        catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }
    /**
     * Delete user
     */
    async deleteUser(id) {
        if (!this.pool) {
            await this.connect();
        }
        try {
            const [result] = await this.pool.query('DELETE FROM users WHERE id = ?', [id]);
            return result.affectedRows === 1;
        }
        catch (error) {
            console.error('Error deleting user:', error);
            return false;
        }
    }
    /**
     * Find all users in the system
     */
    async findAllUsers() {
        if (!this.pool) {
            await this.connect();
        }
        try {
            const [rows] = await this.pool.query('SELECT * FROM users ORDER BY created_at DESC');
            return rows.map(row => this.mapUserFromDb(row));
        }
        catch (error) {
            console.error('Error finding all users:', error);
            return [];
        }
    }
    // Role operations
    /**
     * Create a new role
     */
    async createRole(roleData) {
        if (!this.pool) {
            await this.connect();
        }
        const now = new Date();
        const permissions = roleData.permissions || [];
        const [result] = await this.pool.query(`INSERT INTO roles 
       (name, description, permissions, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?)`, [
            roleData.name,
            roleData.description,
            JSON.stringify(permissions),
            now,
            now
        ]);
        return {
            id: result.insertId.toString(),
            name: roleData.name,
            description: roleData.description,
            permissions,
            createdAt: now,
            updatedAt: now
        };
    }
    /**
     * Get role by ID
     */
    async getRoleById(id) {
        if (!this.pool) {
            await this.connect();
        }
        try {
            const [rows] = await this.pool.query('SELECT * FROM roles WHERE id = ?', [id]);
            if (rows.length === 0) {
                return null;
            }
            return this.mapRoleFromDb(rows[0]);
        }
        catch (error) {
            console.error('Error getting role by ID:', error);
            return null;
        }
    }
    /**
     * Get role by name
     */
    async getRoleByName(name) {
        if (!this.pool) {
            await this.connect();
        }
        try {
            const [rows] = await this.pool.query('SELECT * FROM roles WHERE name = ?', [name]);
            if (rows.length === 0) {
                return null;
            }
            return this.mapRoleFromDb(rows[0]);
        }
        catch (error) {
            console.error('Error getting role by name:', error);
            return null;
        }
    }
    /**
     * Update role
     */
    async updateRole(id, roleData) {
        if (!this.pool) {
            await this.connect();
        }
        try {
            // Build the SET part of the query dynamically based on roleData
            const updates = [];
            const values = [];
            if (roleData.name !== undefined) {
                updates.push('name = ?');
                values.push(roleData.name);
            }
            if (roleData.description !== undefined) {
                updates.push('description = ?');
                values.push(roleData.description);
            }
            if (roleData.permissions !== undefined) {
                updates.push('permissions = ?');
                values.push(JSON.stringify(roleData.permissions));
            }
            // Add ID to values
            values.push(id);
            if (updates.length === 0) {
                // No updates to make, get the current role
                return (await this.getRoleById(id));
            }
            const updateQuery = `
        UPDATE roles 
        SET ${updates.join(', ')} 
        WHERE id = ?
      `;
            await this.pool.query(updateQuery, values);
            // Get the updated role
            const updatedRole = await this.getRoleById(id);
            if (!updatedRole) {
                throw new Error('Role not found after update');
            }
            return updatedRole;
        }
        catch (error) {
            console.error('Error updating role:', error);
            throw error;
        }
    }
    /**
     * Delete role
     */
    async deleteRole(id) {
        if (!this.pool) {
            await this.connect();
        }
        try {
            const [result] = await this.pool.query('DELETE FROM roles WHERE id = ?', [id]);
            return result.affectedRows === 1;
        }
        catch (error) {
            console.error('Error deleting role:', error);
            return false;
        }
    }
    // User-Role operations
    /**
     * Assign role to user
     */
    async assignRoleToUser(userId, roleId) {
        if (!this.pool) {
            await this.connect();
        }
        try {
            // Get the role
            const role = await this.getRoleById(roleId);
            if (!role) {
                throw new Error('Role not found');
            }
            // Get the user
            const user = await this.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            // Check if user already has the role
            if (user.roles.includes(role.name)) {
                return true;
            }
            // Add role to user
            const updatedRoles = [...user.roles, role.name];
            await this.pool.query('UPDATE users SET roles = ? WHERE id = ?', [JSON.stringify(updatedRoles), userId]);
            return true;
        }
        catch (error) {
            console.error('Error assigning role to user:', error);
            throw error;
        }
    }
    /**
     * Remove role from user
     */
    async removeRoleFromUser(userId, roleId) {
        if (!this.pool) {
            await this.connect();
        }
        try {
            // Get the role
            const role = await this.getRoleById(roleId);
            if (!role) {
                throw new Error('Role not found');
            }
            // Get the user
            const user = await this.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            // Check if user has the role
            if (!user.roles.includes(role.name)) {
                return true;
            }
            // Remove role from user
            const updatedRoles = user.roles.filter(r => r !== role.name);
            await this.pool.query('UPDATE users SET roles = ? WHERE id = ?', [JSON.stringify(updatedRoles), userId]);
            return true;
        }
        catch (error) {
            console.error('Error removing role from user:', error);
            throw error;
        }
    }
    /**
     * Get user roles
     */
    async getUserRoles(userId) {
        if (!this.pool) {
            await this.connect();
        }
        try {
            // Get user
            const user = await this.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            // Get roles
            const rolePromises = user.roles.map(roleName => this.getRoleByName(roleName));
            const roles = await Promise.all(rolePromises);
            // Filter out null values (in case a role was deleted)
            return roles.filter((role) => role !== null);
        }
        catch (error) {
            console.error('Error getting user roles:', error);
            throw error;
        }
    }
    // Utility operations
    /**
     * Get user by reset token
     */
    async getUserByResetToken(token) {
        if (!this.pool) {
            await this.connect();
        }
        try {
            const [rows] = await this.pool.query('SELECT * FROM users WHERE reset_password_token = ?', [token]);
            if (rows.length === 0) {
                return null;
            }
            // Check if token is expired
            const user = rows[0];
            if (user.reset_password_expires && new Date(user.reset_password_expires) < new Date()) {
                return null;
            }
            return this.mapUserFromDb(user);
        }
        catch (error) {
            console.error('Error getting user by reset token:', error);
            return null;
        }
    }
    /**
     * Get user by verification token
     */
    async getUserByVerificationToken(token) {
        if (!this.pool) {
            await this.connect();
        }
        try {
            const [rows] = await this.pool.query('SELECT * FROM users WHERE verification_token = ?', [token]);
            if (rows.length === 0) {
                return null;
            }
            return this.mapUserFromDb(rows[0]);
        }
        catch (error) {
            console.error('Error getting user by verification token:', error);
            return null;
        }
    }
    /**
     * Map DB user to User model
     */
    mapUserFromDb(dbUser) {
        // Parse JSON fields
        const roles = typeof dbUser.roles === 'string'
            ? JSON.parse(dbUser.roles)
            : dbUser.roles;
        return {
            id: dbUser.id.toString(),
            email: dbUser.email,
            password: dbUser.password,
            firstName: dbUser.first_name,
            lastName: dbUser.last_name,
            roles,
            isActive: !!dbUser.is_active,
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
    mapRoleFromDb(dbRole) {
        // Parse JSON fields
        const permissions = typeof dbRole.permissions === 'string'
            ? JSON.parse(dbRole.permissions)
            : dbRole.permissions;
        return {
            id: dbRole.id.toString(),
            name: dbRole.name,
            description: dbRole.description,
            permissions,
            createdAt: dbRole.created_at,
            updatedAt: dbRole.updated_at
        };
    }
}
exports.MySqlAdapter = MySqlAdapter;
//# sourceMappingURL=mysql.js.map