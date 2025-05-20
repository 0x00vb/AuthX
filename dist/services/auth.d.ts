import { AuthXConfig } from '../config/types';
import { DbAdapter } from '../adapters/db';
import { User, UserCreateInput } from '../models';
/**
 * Authentication service
 * Handles business logic for authentication operations
 */
export declare class AuthService {
    private config;
    private dbAdapter;
    constructor(config: AuthXConfig, dbAdapter: DbAdapter);
    /**
     * Register a new user
     * @param userData User registration data
     */
    register(userData: UserCreateInput): Promise<{
        user: User;
        token: string;
    }>;
    /**
     * Log in a user
     * @param email User email
     * @param password User password
     */
    login(email: string, password: string): Promise<{
        user: User;
        token: string;
        refreshToken: string;
    }>;
    /**
     * Generate a password reset token
     * @param email User email
     */
    forgotPassword(email: string): Promise<{
        resetToken: string;
    }>;
    /**
     * Reset a user's password
     * @param token Reset token
     * @param newPassword New password
     */
    resetPassword(token: string, newPassword: string): Promise<boolean>;
    /**
     * Refresh an access token using a refresh token
     * @param refreshToken Refresh token
     */
    refreshToken(refreshToken: string): Promise<{
        token: string;
        refreshToken: string;
    }>;
    /**
     * Generate JWT token
     * @param user User to generate token for
     */
    private generateToken;
    /**
     * Generate refresh token
     * @param user User to generate refresh token for
     */
    private generateRefreshToken;
}
