import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services';
import { AuthRequest } from '../middleware/types';

/**
 * Authentication controller
 * Handles HTTP requests for authentication operations
 */
export class AuthController {
  private authService: AuthService;
  
  constructor(authService: AuthService) {
    this.authService = authService;
  }
  
  /**
   * Register a new user
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const { email, password, firstName, lastName } = req.body;
      
      // Register user
      const { user, token } = await this.authService.register({
        email,
        password,
        firstName,
        lastName,
      });
      
      // Remove password from response
      const userResponse = { ...user, password: undefined };
      
      res.status(201).json({ user: userResponse, token });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during registration';
      res.status(400).json({ message });
    }
  };
  
  /**
   * Log in a user
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const { email, password } = req.body;
      
      // Login user
      const { user, token, refreshToken } = await this.authService.login(email, password);
      
      // Remove password from response
      const userResponse = { ...user, password: undefined };
      
      res.status(200).json({ user: userResponse, token, refreshToken });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during login';
      res.status(401).json({ message });
    }
  };
  
  /**
   * Get the current user
   */
  public getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }
      
      // Remove password from response
      const userResponse = { ...req.user, password: undefined };
      
      res.status(200).json({ user: userResponse });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message });
    }
  };
  
  /**
   * Request password reset
   */
  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const { email } = req.body;
      
      // Request password reset
      const { resetToken } = await this.authService.forgotPassword(email);
      
      // Here you would typically send an email with the reset token
      // This is just a placeholder for demonstration
      
      res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({ message });
    }
  };
  
  /**
   * Reset password
   */
  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const { token, password } = req.body;
      
      // Reset password
      await this.authService.resetPassword(token, password);
      
      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(400).json({ message });
    }
  };
  
  /**
   * Refresh access token
   */
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const { refreshToken } = req.body;
      
      // Refresh token
      const tokens = await this.authService.refreshToken(refreshToken);
      
      res.status(200).json(tokens);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(401).json({ message });
    }
  };
} 