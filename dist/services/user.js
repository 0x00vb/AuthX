"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
/**
 * UserService handles all user-related business logic
 */
class UserService {
    constructor(config, dbAdapter) {
        this.config = config;
        this.dbAdapter = dbAdapter;
    }
    /**
     * Get a user by ID
     */
    async getUserById(id) {
        return this.dbAdapter.getUserById(id);
    }
    /**
     * Get a user by email
     */
    async getUserByEmail(email) {
        return this.dbAdapter.getUserByEmail(email);
    }
    /**
     * Create a new user
     */
    async createUser(userData) {
        return this.dbAdapter.createUser(userData);
    }
    /**
     * Update a user
     */
    async updateUser(id, userData) {
        return this.dbAdapter.updateUser(id, userData);
    }
    /**
     * Delete a user
     */
    async deleteUser(id) {
        return this.dbAdapter.deleteUser(id);
    }
    /**
     * Get all users in the system
     *
     * This method provides a fallback implementation if the adapter doesn't support findAllUsers
     */
    async getAllUsers() {
        try {
            // First try to use the adapter's native method if available
            if (typeof this.dbAdapter.findAllUsers === 'function') {
                return await this.dbAdapter.findAllUsers();
            }
            // If not available, log a warning but don't break functionality
            console.warn('DbAdapter does not implement findAllUsers. Using fallback method.');
            // NOTE: This is a simple mock fallback that returns an empty array
            // In a real-world scenario, you might want to implement a more sophisticated
            // fallback, for example by using other available methods or a different data source.
            return [];
        }
        catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.js.map