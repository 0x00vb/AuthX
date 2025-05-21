import { DbAdapter } from '../adapters/db/adapter';
import { User, UserCreateInput, UserUpdateInput } from '../models';
import { AuthXConfig } from '../config/types';
/**
 * UserService handles all user-related business logic
 */
export declare class UserService {
    private dbAdapter;
    private config;
    constructor(config: AuthXConfig, dbAdapter: DbAdapter);
    /**
     * Get a user by ID
     */
    getUserById(id: string): Promise<User | null>;
    /**
     * Get a user by email
     */
    getUserByEmail(email: string): Promise<User | null>;
    /**
     * Create a new user
     */
    createUser(userData: UserCreateInput): Promise<User>;
    /**
     * Update a user
     */
    updateUser(id: string, userData: UserUpdateInput): Promise<User>;
    /**
     * Delete a user
     */
    deleteUser(id: string): Promise<boolean>;
    /**
     * Get all users in the system
     *
     * This method provides a fallback implementation if the adapter doesn't support findAllUsers
     */
    getAllUsers(): Promise<User[]>;
}
