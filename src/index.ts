import express, { Express, Router } from 'express';
import dotenv from 'dotenv';
import { AuthXConfig } from './config/types';
import { defaultConfig } from './config/default';
import { setupRoutes } from './routes';
import { AuthXMiddleware } from './middleware';
import { getDbAdapter } from './adapters/db';
import { AuthService, RoleService, UserService } from './services';
import { CustomUserFields, UserExtensionConfig, UserExtensionField } from './models/user';

// Load environment variables
dotenv.config();

export class AuthX<T extends CustomUserFields = {}> {
  private config: AuthXConfig;
  private app: Express;
  private router: Router;
  public middleware: AuthXMiddleware;
  private authService: AuthService;
  private roleService: RoleService;
  private userService: UserService<T>;

  constructor(userConfig: Partial<AuthXConfig> = {}) {
    // Merge default config with user provided config
    this.config = {
      ...defaultConfig,
      ...userConfig,
    };

    // Initialize express app
    this.app = express();
    this.app.use(express.json());

    // Initialize database adapter
    const dbAdapter = getDbAdapter<T>(this.config);

    // Initialize services
    this.authService = new AuthService(this.config, dbAdapter);
    this.roleService = new RoleService(this.config, dbAdapter);
    this.userService = new UserService<T>(this.config, dbAdapter);

    // Initialize router
    this.router = express.Router();
    setupRoutes(this.router, this.config, dbAdapter);

    // Initialize middleware
    this.middleware = new AuthXMiddleware(this.config, dbAdapter);
  }

  /**
   * Get the Express router with all authentication routes
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Get the Express app instance
   */
  public getApp(): Express {
    return this.app;
  }

  /**
   * Get the current configuration
   */
  public getConfig(): AuthXConfig {
    return this.config;
  }

  /**
   * Get auth service for customization
   */
  public getAuthService(): AuthService {
    return this.authService;
  }

  /**
   * Get role service for customization
   */
  public getRoleService(): RoleService {
    return this.roleService;
  }

  /**
   * Get user service for customization
   */
  public getUserService(): UserService<T> {
    return this.userService;
  }
  
  /**
   * Extend the user model with custom fields
   * @param extensionConfig Configuration for custom user fields
   */
  public extendUserModel(extensionConfig: UserExtensionConfig): void {
    // Merge with existing extensions
    const existingFields = this.config.userExtensions?.fields || [];
    
    // Avoid duplicates by removing fields with the same name
    const filteredExisting = existingFields.filter(
      existingField => !extensionConfig.fields.some(newField => newField.name === existingField.name)
    );
    
    // Update config with merged fields
    this.config.userExtensions = {
      fields: [...filteredExisting, ...extensionConfig.fields]
    };
  }
  
  /**
   * Add a custom field to the user model
   * @param field The field definition to add
   */
  public addUserField(field: UserExtensionField): void {
    if (!this.config.userExtensions) {
      this.config.userExtensions = { fields: [] };
    }
    
    // Check if field already exists
    const existingIndex = this.config.userExtensions.fields.findIndex(f => f.name === field.name);
    
    if (existingIndex >= 0) {
      // Replace existing field
      this.config.userExtensions.fields[existingIndex] = field;
    } else {
      // Add new field
      this.config.userExtensions.fields.push(field);
    }
  }
}

// Export types
export * from './config/types';
export * from './models';
export * from './middleware/types';
export * from './services';

// Export default for compatibility
export default AuthX; 