import { Express, Router } from 'express';
import { AuthXConfig } from './config/types';
import { AuthXMiddleware } from './middleware';
export declare class AuthX {
    private config;
    private app;
    private router;
    middleware: AuthXMiddleware;
    constructor(userConfig?: Partial<AuthXConfig>);
    /**
     * Get the Express router with all authentication routes
     */
    getRouter(): Router;
    /**
     * Get the Express app instance
     */
    getApp(): Express;
    /**
     * Get the current configuration
     */
    getConfig(): AuthXConfig;
}
export * from './config/types';
export * from './models';
export * from './middleware/types';
export default AuthX;
