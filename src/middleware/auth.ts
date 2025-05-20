import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthXConfig } from '../config/types';
import { DbAdapter } from '../adapters/db';
import { AuthRequest, AuthMiddlewareOptions, RoleMiddlewareOptions } from './types';

/**
 * Authentication middleware class
 * Provides middleware functions for authenticating users and checking roles
 */
export class AuthXMiddleware {
  private config: AuthXConfig;
  private dbAdapter: DbAdapter;
  
  constructor(config: AuthXConfig, dbAdapter: DbAdapter) {
    this.config = config;
    this.dbAdapter = dbAdapter;
  }
  
  /**
   * Middleware to authenticate users with JWT
   * @param options Authentication options
   */
  public authenticate(options: AuthMiddlewareOptions = {}) {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          if (options.throwError) {
            res.status(401).json({ message: 'No token provided' });
            return;
          }
          return next();
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(token, this.config.jwtSecret) as { id: string };
        
        // Get user from database
        const user = await this.dbAdapter.getUserById(decoded.id);
        if (!user) {
          if (options.throwError) {
            res.status(401).json({ message: 'Invalid token' });
            return;
          }
          return next();
        }
        
        // Attach user to request
        req.user = user;
        req.token = token;
        
        next();
      } catch (error) {
        if (options.throwError) {
          res.status(401).json({ message: 'Invalid token' });
          return;
        }
        next();
      }
    };
  }
  
  /**
   * Middleware to check if user has a specific role
   * @param role Role to check
   * @param options Role middleware options
   */
  public hasRole(role: string, options: RoleMiddlewareOptions = {}) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      
      if (!req.user.roles.includes(role)) {
        if (options.throwError) {
          res.status(403).json({ message: `User does not have required role: ${role}` });
          return;
        }
        return next();
      }
      
      next();
    };
  }
  
  /**
   * Middleware to check if user has any of the specified roles
   * @param roles Roles to check
   * @param options Role middleware options
   */
  public hasAnyRole(roles: string[], options: RoleMiddlewareOptions = {}) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      
      const hasRole = roles.some(role => req.user!.roles.includes(role));
      if (!hasRole) {
        if (options.throwError) {
          res.status(403).json({ message: `User does not have any of the required roles: ${roles.join(', ')}` });
          return;
        }
        return next();
      }
      
      next();
    };
  }
  
  /**
   * Middleware to check if user has all of the specified roles
   * @param roles Roles to check
   * @param options Role middleware options
   */
  public hasAllRoles(roles: string[], options: RoleMiddlewareOptions = {}) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      
      const hasAllRoles = roles.every(role => req.user!.roles.includes(role));
      if (!hasAllRoles) {
        if (options.throwError) {
          res.status(403).json({ message: `User does not have all required roles: ${roles.join(', ')}` });
          return;
        }
        return next();
      }
      
      next();
    };
  }
} 