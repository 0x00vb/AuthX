import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthXConfig } from '../config/types';
import { DbAdapter } from '../adapters/db';
import { User, UserCreateInput } from '../models';

/**
 * Authentication service
 * Handles business logic for authentication operations
 */
export class AuthService {
  private config: AuthXConfig;
  private dbAdapter: DbAdapter;
  
  constructor(config: AuthXConfig, dbAdapter: DbAdapter) {
    this.config = config;
    this.dbAdapter = dbAdapter;
  }
  
  /**
   * Register a new user
   * @param userData User registration data
   */
  public async register(userData: UserCreateInput): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await this.dbAdapter.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Create user with default role
    const userToCreate = {
      ...userData,
      password: hashedPassword,
      roles: userData.roles || [this.config.defaultRole],
    };
    
    const user = await this.dbAdapter.createUser(userToCreate);
    
    // Generate JWT token
    const token = this.generateToken(user);
    
    return { user, token };
  }
  
  /**
   * Log in a user
   * @param email User email
   * @param password User password
   */
  public async login(email: string, password: string): Promise<{ user: User; token: string; refreshToken: string }> {
    // Find user by email
    const user = await this.dbAdapter.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is inactive');
    }
    
    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    const updatedUser = await this.dbAdapter.updateUser(user.id, { lastLogin: new Date() });
    
    // Generate tokens
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    return { user: updatedUser, token, refreshToken };
  }
  
  /**
   * Generate a password reset token
   * @param email User email
   */
  public async forgotPassword(email: string): Promise<{ resetToken: string }> {
    // Find user by email
    const user = await this.dbAdapter.getUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour
    
    // Update user with reset token
    await this.dbAdapter.updateUser(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpires,
    });
    
    return { resetToken };
  }
  
  /**
   * Reset a user's password
   * @param token Reset token
   * @param newPassword New password
   */
  public async resetPassword(token: string, newPassword: string): Promise<boolean> {
    // Find user by reset token
    const user = await this.dbAdapter.getUserByResetToken(token);
    if (!user) {
      throw new Error('Invalid token');
    }
    
    // Check if token is expired
    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      throw new Error('Token expired');
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update user with new password and clear token
    await this.dbAdapter.updateUser(user.id, {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });
    
    return true;
  }
  
  /**
   * Refresh an access token using a refresh token
   * @param refreshToken Refresh token
   */
  public async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.config.refreshTokenSecret) as { id: string };
      
      // Get user
      const user = await this.dbAdapter.getUserById(decoded.id);
      if (!user) {
        throw new Error('Invalid token');
      }
      
      // Generate new tokens
      const newToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user);
      
      return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
  
  /**
   * Generate JWT token
   * @param user User to generate token for
   */
  private generateToken(user: User): string {
    return jwt.sign(
      { id: user.id },
      this.config.jwtSecret,
      { expiresIn: this.config.jwtExpiresIn } as jwt.SignOptions
    );
  }
  
  /**
   * Generate refresh token
   * @param user User to generate refresh token for
   */
  private generateRefreshToken(user: User): string {
    return jwt.sign(
      { id: user.id },
      this.config.refreshTokenSecret,
      { expiresIn: this.config.refreshTokenExpiresIn } as jwt.SignOptions
    );
  }
} 