"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDbAdapter = void 0;
const mongodb_1 = require("mongodb");
/**
 * MongoDB adapter implementation
 */
class MongoDbAdapter {
    constructor(config) {
        this.client = null;
        this.usersCollection = null;
        this.rolesCollection = null;
        this.config = config;
    }
    /**
     * Connect to MongoDB database
     */
    async connect() {
        try {
            this.client = new mongodb_1.MongoClient(this.config.dbUri);
            await this.client.connect();
            const db = this.client.db();
            this.usersCollection = db.collection('users');
            this.rolesCollection = db.collection('roles');
            // Create indexes
            await this.usersCollection.createIndex({ email: 1 }, { unique: true });
            await this.usersCollection.createIndex({ resetPasswordToken: 1 }, { sparse: true });
            await this.usersCollection.createIndex({ verificationToken: 1 }, { sparse: true });
            await this.rolesCollection.createIndex({ name: 1 }, { unique: true });
            console.log('Connected to MongoDB');
        }
        catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }
    /**
     * Disconnect from MongoDB database
     */
    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.usersCollection = null;
            this.rolesCollection = null;
            console.log('Disconnected from MongoDB');
        }
    }
    // User operations
    /**
     * Create a new user
     */
    async createUser(userData) {
        if (!this.usersCollection) {
            await this.connect();
        }
        const now = new Date();
        const newUser = {
            email: userData.email,
            password: userData.password,
            firstName: userData.firstName,
            lastName: userData.lastName,
            roles: userData.roles || [this.config.defaultRole],
            isActive: true,
            createdAt: now,
            updatedAt: now
        };
        const result = await this.usersCollection.insertOne(newUser);
        return {
            id: result.insertedId.toString(),
            ...newUser
        };
    }
    /**
     * Get user by ID
     */
    async getUserById(id) {
        if (!this.usersCollection) {
            await this.connect();
        }
        try {
            const user = await this.usersCollection.findOne({ _id: new mongodb_1.ObjectId(id) });
            if (!user) {
                return null;
            }
            return this.mapUserFromDb(user);
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
        if (!this.usersCollection) {
            await this.connect();
        }
        const user = await this.usersCollection.findOne({ email });
        if (!user) {
            return null;
        }
        return this.mapUserFromDb(user);
    }
    /**
     * Update user
     */
    async updateUser(id, userData) {
        if (!this.usersCollection) {
            await this.connect();
        }
        const updateData = {
            ...userData,
            updatedAt: new Date()
        };
        const result = await this.usersCollection.findOneAndUpdate({ _id: new mongodb_1.ObjectId(id) }, { $set: updateData }, { returnDocument: 'after' });
        if (!result) {
            throw new Error('User not found');
        }
        return this.mapUserFromDb(result);
    }
    /**
     * Delete user
     */
    async deleteUser(id) {
        if (!this.usersCollection) {
            await this.connect();
        }
        const result = await this.usersCollection.deleteOne({ _id: new mongodb_1.ObjectId(id) });
        return result.deletedCount === 1;
    }
    /**
     * Find all users in the system
     */
    async findAllUsers() {
        if (!this.usersCollection) {
            await this.connect();
        }
        try {
            const users = await this.usersCollection.find()
                .sort({ createdAt: -1 })
                .toArray();
            return users.map(user => this.mapUserFromDb(user));
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
        if (!this.rolesCollection) {
            await this.connect();
        }
        const now = new Date();
        const newRole = {
            name: roleData.name,
            description: roleData.description,
            permissions: roleData.permissions || [],
            createdAt: now,
            updatedAt: now
        };
        const result = await this.rolesCollection.insertOne(newRole);
        return {
            id: result.insertedId.toString(),
            ...newRole
        };
    }
    /**
     * Get role by ID
     */
    async getRoleById(id) {
        if (!this.rolesCollection) {
            await this.connect();
        }
        try {
            const role = await this.rolesCollection.findOne({ _id: new mongodb_1.ObjectId(id) });
            if (!role) {
                return null;
            }
            return this.mapRoleFromDb(role);
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
        if (!this.rolesCollection) {
            await this.connect();
        }
        const role = await this.rolesCollection.findOne({ name });
        if (!role) {
            return null;
        }
        return this.mapRoleFromDb(role);
    }
    /**
     * Update role
     */
    async updateRole(id, roleData) {
        if (!this.rolesCollection) {
            await this.connect();
        }
        const updateData = {
            ...roleData,
            updatedAt: new Date()
        };
        const result = await this.rolesCollection.findOneAndUpdate({ _id: new mongodb_1.ObjectId(id) }, { $set: updateData }, { returnDocument: 'after' });
        if (!result) {
            throw new Error('Role not found');
        }
        return this.mapRoleFromDb(result);
    }
    /**
     * Delete role
     */
    async deleteRole(id) {
        if (!this.rolesCollection) {
            await this.connect();
        }
        const result = await this.rolesCollection.deleteOne({ _id: new mongodb_1.ObjectId(id) });
        return result.deletedCount === 1;
    }
    // User-Role operations
    /**
     * Assign role to user
     */
    async assignRoleToUser(userId, roleId) {
        if (!this.usersCollection) {
            await this.connect();
        }
        // Get role to verify it exists
        const role = await this.getRoleById(roleId);
        if (!role) {
            throw new Error('Role not found');
        }
        const result = await this.usersCollection.updateOne({ _id: new mongodb_1.ObjectId(userId) }, { $addToSet: { roles: role.name } });
        return result.modifiedCount === 1;
    }
    /**
     * Remove role from user
     */
    async removeRoleFromUser(userId, roleId) {
        if (!this.usersCollection) {
            await this.connect();
        }
        // Get role to verify it exists
        const role = await this.getRoleById(roleId);
        if (!role) {
            throw new Error('Role not found');
        }
        const user = await this.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const updatedRoles = user.roles.filter(r => r !== role.name);
        const result = await this.usersCollection.updateOne({ _id: new mongodb_1.ObjectId(userId) }, { $set: { roles: updatedRoles } });
        return result.modifiedCount === 1;
    }
    /**
     * Get user roles
     */
    async getUserRoles(userId) {
        if (!this.usersCollection) {
            await this.connect();
        }
        const user = await this.getUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const roles = await Promise.all(user.roles.map(async (roleName) => {
            const role = await this.getRoleByName(roleName);
            if (!role) {
                throw new Error(`Role not found: ${roleName}`);
            }
            return role;
        }));
        return roles;
    }
    // Utility operations
    /**
     * Get user by reset token
     */
    async getUserByResetToken(token) {
        if (!this.usersCollection) {
            await this.connect();
        }
        const user = await this.usersCollection.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });
        if (!user) {
            return null;
        }
        return this.mapUserFromDb(user);
    }
    /**
     * Get user by verification token
     */
    async getUserByVerificationToken(token) {
        if (!this.usersCollection) {
            await this.connect();
        }
        const user = await this.usersCollection.findOne({ verificationToken: token });
        if (!user) {
            return null;
        }
        return this.mapUserFromDb(user);
    }
    /**
     * Map MongoDB document to User model
     */
    mapUserFromDb(dbUser) {
        const { _id, ...userData } = dbUser;
        return {
            id: _id.toString(),
            ...userData
        };
    }
    /**
     * Map MongoDB document to Role model
     */
    mapRoleFromDb(dbRole) {
        const { _id, ...roleData } = dbRole;
        return {
            id: _id.toString(),
            ...roleData
        };
    }
}
exports.MongoDbAdapter = MongoDbAdapter;
//# sourceMappingURL=mongodb.js.map