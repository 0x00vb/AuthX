import { User, UserCreateInput, UserUpdateInput, CustomUserFields, UserExtensionConfig, UserExtensionField } from '../models/user';
import { AuthXConfig } from '../config/types';

/**
 * Helper class for working with custom user fields
 */
export class UserExtensionHelper {
  /**
   * Creates a new configuration for user extensions
   * @param fields Array of custom fields to add
   */
  static createExtensionConfig(fields: UserExtensionField[]): UserExtensionConfig {
    return { fields };
  }

  /**
   * Creates a field definition for a user extension
   * @param name Field name
   * @param type Field type
   * @param options Additional options
   */
  static field(
    name: string, 
    type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array',
    options: {
      required?: boolean;
      defaultValue?: any;
      roles?: string[];
    } = {}
  ): UserExtensionField {
    return {
      name,
      type,
      required: options.required,
      defaultValue: options.defaultValue,
      roles: options.roles
    };
  }

  /**
   * Extract role-specific fields from a user
   * @param user User object with custom fields
   * @param role Role to extract fields for
   * @param config AuthX configuration
   */
  static getRoleFields<T extends CustomUserFields>(
    user: User<T>, 
    role: string,
    config: AuthXConfig
  ): Partial<T> {
    if (!user.custom || !config.userExtensions?.fields.length) {
      return {};
    }

    const roleFields = config.userExtensions.fields.filter(
      field => !field.roles || field.roles.includes(role)
    ).map(field => field.name);

    // Extract only fields that apply to the role
    return Object.entries(user.custom)
      .filter(([key]) => roleFields.includes(key))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}) as Partial<T>;
  }

  /**
   * Get full type definition for custom user fields based on configuration
   * This can be used for documentation or schema generation
   * @param config AuthX configuration
   */
  static getFieldsSchema(config: AuthXConfig): Record<string, { type: string; required: boolean }> {
    if (!config.userExtensions?.fields.length) {
      return {};
    }

    return config.userExtensions.fields.reduce((schema, field) => {
      return {
        ...schema,
        [field.name]: {
          type: field.type,
          required: field.required || false,
          roles: field.roles || []
        }
      };
    }, {});
  }

  /**
   * Helper to create an empty user custom fields object
   * that is initialized with default values from configuration
   * @param config AuthX configuration
   * @param roles User roles (for role-specific fields)
   */
  static createEmptyCustomFields<T extends CustomUserFields>(
    config: AuthXConfig,
    roles: string[] = []
  ): T {
    if (!config.userExtensions?.fields.length) {
      return {} as T;
    }

    // Filter fields by role and initialize with default values
    return config.userExtensions.fields
      .filter(field => !field.roles || field.roles.some(role => roles.includes(role)))
      .reduce((result, field) => {
        if (field.defaultValue !== undefined) {
          result[field.name] = field.defaultValue;
        }
        return result;
      }, {} as Record<string, any>) as T;
  }

  /**
   * Validate custom fields against configuration
   * @param customFields The custom fields to validate
   * @param roles User roles for role-specific validation
   * @param config AuthX configuration
   */
  static validateCustomFields<T extends CustomUserFields>(
    customFields: T,
    roles: string[],
    config: AuthXConfig
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.userExtensions?.fields.length) {
      return { valid: true, errors };
    }

    for (const field of config.userExtensions.fields) {
      // Skip fields that are only for specific roles if the user doesn't have any of those roles
      if (field.roles && field.roles.length && !field.roles.some(role => roles.includes(role))) {
        continue;
      }

      // Check if required field is missing
      if (field.required && !customFields.hasOwnProperty(field.name)) {
        errors.push(`Required custom field '${field.name}' is missing`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
} 