import { Express, Router } from 'express';
import { AuthXConfig } from './config/types';
import { AuthXMiddleware } from './middleware';
import { AuthService, RoleService, UserService } from './services';
export declare class AuthX {
    private config;
    private app;
    private router;
    middleware: AuthXMiddleware;
    private authService;
    private roleService;
    private userService;
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
    /**
     * Get auth service for customization
     */
    getAuthService(): AuthService;
    /**
     * Get role service for customization
     */
    getRoleService(): RoleService;
    /**
     * Get user service for customization
     */
    getUserService(): UserService;
}
export * from './config/types';
export * from './models';
export * from './middleware/types';
export * from './services';
export default AuthX;
