import { Response, NextFunction } from 'express';
import { AuthXConfig } from '../config/types';
import { DbAdapter } from '../adapters/db';
import { AuthRequest, AuthMiddlewareOptions, RoleMiddlewareOptions } from './types';
/**
 * Authentication middleware class
 * Provides middleware functions for authenticating users and checking roles
 */
export declare class AuthXMiddleware {
    private config;
    private dbAdapter;
    constructor(config: AuthXConfig, dbAdapter: DbAdapter);
    /**
     * Middleware to authenticate users with JWT
     * @param options Authentication options
     */
    authenticate(options?: AuthMiddlewareOptions): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Middleware to check if user has a specific role
     * @param role Role to check
     * @param options Role middleware options
     */
    hasRole(role: string, options?: RoleMiddlewareOptions): (req: AuthRequest, res: Response, next: NextFunction) => void;
    /**
     * Middleware to check if user has any of the specified roles
     * @param roles Roles to check
     * @param options Role middleware options
     */
    hasAnyRole(roles: string[], options?: RoleMiddlewareOptions): (req: AuthRequest, res: Response, next: NextFunction) => void;
    /**
     * Middleware to check if user has all of the specified roles
     * @param roles Roles to check
     * @param options Role middleware options
     */
    hasAllRoles(roles: string[], options?: RoleMiddlewareOptions): (req: AuthRequest, res: Response, next: NextFunction) => void;
}
