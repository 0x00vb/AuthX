import { DbAdapter } from '../adapters/db/adapter';
import { User, UserCreateInput, UserUpdateInput, CustomUserFields, UserExtensionField } from '../models';
import { AuthXConfig } from '../config/types';

/**
 * UserService handles all user-related business logic
 */
export class UserService<T extends CustomUserFields = {}> {
  private dbAdapter: DbAdapter<T>;
  private config: AuthXConfig;

  constructor(config: AuthXConfig, dbAdapter: DbAdapter<T>) {
    this.config = config;
    this.dbAdapter = dbAdapter;
  }

  /**
   * Get a user by ID
   */
  async getUserById(id: string): Promise<User<T> | null> {
    return this.dbAdapter.getUserById(id);
  }

  /**
   * Get a user by email
   */
  async getUserByEmail(email: string): Promise<User<T> | null> {
    return this.dbAdapter.getUserByEmail(email);
  }

  /**
   * Create a new user with validation for custom fields
   */
  async createUser(userData: UserCreateInput<T>): Promise<User<T>> {
    // Validate custom fields if they exist and if user extensions are configured
    if (userData.custom && this.config.userExtensions?.fields.length) {
      this.validateCustomFields(userData.custom, userData.roles || [this.config.defaultRole]);
    }
    
    return this.dbAdapter.createUser(userData);
  }

  /**
   * Update a user with validation for custom fields
   */
  async updateUser(id: string, userData: UserUpdateInput<T>): Promise<User<T>> {
    // If updating custom fields, validate them first
    if (userData.custom && this.config.userExtensions?.fields.length) {
      // Get the user's current roles for validation
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new Error('User not found');
      }
      
      this.validateCustomFields(userData.custom as T, userData.roles || existingUser.roles);
    }
    
    return this.dbAdapter.updateUser(id, userData);
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<boolean> {
    return this.dbAdapter.deleteUser(id);
  }

  /**
   * Get all users in the system
   * 
   * This method provides a fallback implementation if the adapter doesn't support findAllUsers
   */
  async getAllUsers(): Promise<User<T>[]> {
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
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
  
  /**
   * Validate custom fields against configuration
   * @param customFields The custom fields to validate
   * @param userRoles The user's roles for role-specific validation
   */
  private validateCustomFields(customFields: Partial<T>, userRoles: string[]): void {
    if (!this.config.userExtensions?.fields.length) {
      return;
    }
    
    // Check for required fields
    for (const field of this.config.userExtensions.fields) {
      // Skip fields that are only for specific roles if the user doesn't have any of those roles
      if (field.roles && field.roles.length && !field.roles.some(role => userRoles.includes(role))) {
        continue;
      }
      
      // Check if required field is missing
      if (field.required && !customFields.hasOwnProperty(field.name)) {
        throw new Error(`Required custom field '${field.name}' is missing`);
      }
      
      // Type validation could be added here in the future
    }
  }
  
  /**
   * Get the list of custom fields available for a specific role
   * @param role The role to get fields for
   * @returns Array of field definitions for the role
   */
  getCustomFieldsForRole(role: string): UserExtensionField[] {
    if (!this.config.userExtensions?.fields.length) {
      return [];
    }
    
    return this.config.userExtensions.fields.filter(field => 
      !field.roles || field.roles.includes(role)
    );
  }
} 