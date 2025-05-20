import { Request, Response } from 'express';
import { AuthService } from '../services';
import { AuthRequest } from '../middleware/types';
/**
 * Authentication controller
 * Handles HTTP requests for authentication operations
 */
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    /**
     * Register a new user
     */
    register: (req: Request, res: Response) => Promise<void>;
    /**
     * Log in a user
     */
    login: (req: Request, res: Response) => Promise<void>;
    /**
     * Get the current user
     */
    getMe: (req: AuthRequest, res: Response) => Promise<void>;
    /**
     * Request password reset
     */
    forgotPassword: (req: Request, res: Response) => Promise<void>;
    /**
     * Reset password
     */
    resetPassword: (req: Request, res: Response) => Promise<void>;
    /**
     * Refresh access token
     */
    refreshToken: (req: Request, res: Response) => Promise<void>;
}
