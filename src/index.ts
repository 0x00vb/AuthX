import express, { Express, Router } from 'express';
import dotenv from 'dotenv';
import { AuthXConfig } from './config/types';
import { defaultConfig } from './config/default';
import { setupRoutes } from './routes';
import { AuthXMiddleware } from './middleware';
import { getDbAdapter } from './adapters/db';

// Load environment variables
dotenv.config();

export class AuthX {
  private config: AuthXConfig;
  private app: Express;
  private router: Router;
  public middleware: AuthXMiddleware;

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
    const dbAdapter = getDbAdapter(this.config);

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
}

// Export types
export * from './config/types';
export * from './models';
export * from './middleware/types';

// Export default for compatibility
export default AuthX; 