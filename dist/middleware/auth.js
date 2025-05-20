"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthXMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Authentication middleware class
 * Provides middleware functions for authenticating users and checking roles
 */
class AuthXMiddleware {
    constructor(config, dbAdapter) {
        this.config = config;
        this.dbAdapter = dbAdapter;
    }
    /**
     * Middleware to authenticate users with JWT
     * @param options Authentication options
     */
    authenticate(options = {}) {
        return async (req, res, next) => {
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
                const decoded = jsonwebtoken_1.default.verify(token, this.config.jwtSecret);
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
            }
            catch (error) {
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
    hasRole(role, options = {}) {
        return (req, res, next) => {
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
    hasAnyRole(roles, options = {}) {
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({ message: 'User not authenticated' });
                return;
            }
            const hasRole = roles.some(role => req.user.roles.includes(role));
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
    hasAllRoles(roles, options = {}) {
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({ message: 'User not authenticated' });
                return;
            }
            const hasAllRoles = roles.every(role => req.user.roles.includes(role));
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
exports.AuthXMiddleware = AuthXMiddleware;
//# sourceMappingURL=auth.js.map