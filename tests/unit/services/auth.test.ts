import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../../src/services';
import { defaultConfig } from '../../../src/config/default';
import { DbAdapter } from '../../../src/adapters/db/adapter';
import { User, UserCreateInput } from '../../../src/models';

// Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

// Mock implementation of DbAdapter
const mockDbAdapter: Partial<DbAdapter> = {
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  getUserById: jest.fn(),
  getUserByResetToken: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  const mockConfig = { ...defaultConfig };
  
  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(mockConfig, mockDbAdapter as DbAdapter);
  });
  
  describe('register', () => {
    it('should register a new user', async () => {
      // Arrange
      const userData: UserCreateInput = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      
      const mockHashedPassword = 'hashedpassword';
      const mockUser: User = {
        id: '123',
        email: userData.email,
        password: mockHashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roles: [mockConfig.defaultRole],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (mockDbAdapter.getUserByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);
      (mockDbAdapter.createUser as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mocktoken');
      
      // Act
      const result = await authService.register(userData);
      
      // Assert
      expect(mockDbAdapter.getUserByEmail).toHaveBeenCalledWith(userData.email);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 'salt');
      expect(mockDbAdapter.createUser).toHaveBeenCalledWith({
        ...userData,
        password: mockHashedPassword,
        roles: [mockConfig.defaultRole],
      });
      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toEqual({
        user: mockUser,
        token: 'mocktoken',
      });
    });
    
    it('should throw an error if user already exists', async () => {
      // Arrange
      const userData: UserCreateInput = {
        email: 'existing@example.com',
        password: 'password123',
      };
      
      const existingUser: User = {
        id: '123',
        email: userData.email,
        password: 'hashedpassword',
        roles: ['user'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (mockDbAdapter.getUserByEmail as jest.Mock).mockResolvedValue(existingUser);
      
      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow('User already exists');
      expect(mockDbAdapter.getUserByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockDbAdapter.createUser).not.toHaveBeenCalled();
    });
  });
  
  describe('login', () => {
    it('should login a user with valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      
      const mockUser: User = {
        id: '123',
        email,
        password: 'hashedpassword',
        roles: ['user'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updatedUser = {
        ...mockUser,
        lastLogin: new Date(),
      };
      
      (mockDbAdapter.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockDbAdapter.updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (jwt.sign as jest.Mock).mockReturnValueOnce('accesstoken').mockReturnValueOnce('refreshtoken');
      
      // Act
      const result = await authService.login(email, password);
      
      // Assert
      expect(mockDbAdapter.getUserByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(mockDbAdapter.updateUser).toHaveBeenCalledWith(mockUser.id, { lastLogin: expect.any(Date) });
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        user: updatedUser,
        token: 'accesstoken',
        refreshToken: 'refreshtoken',
      });
    });
    
    it('should throw an error if user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';
      
      (mockDbAdapter.getUserByEmail as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow('Invalid credentials');
      expect(mockDbAdapter.getUserByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
    
    it('should throw an error if account is inactive', async () => {
      // Arrange
      const email = 'inactive@example.com';
      const password = 'password123';
      
      const mockUser: User = {
        id: '123',
        email,
        password: 'hashedpassword',
        roles: ['user'],
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (mockDbAdapter.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      
      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow('Account is inactive');
      expect(mockDbAdapter.getUserByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
    
    it('should throw an error if password is invalid', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      
      const mockUser: User = {
        id: '123',
        email,
        password: 'hashedpassword',
        roles: ['user'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (mockDbAdapter.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow('Invalid credentials');
      expect(mockDbAdapter.getUserByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(mockDbAdapter.updateUser).not.toHaveBeenCalled();
    });
  });
  
  describe('forgotPassword', () => {
    it('should generate a reset token for a valid user', async () => {
      // Arrange
      const email = 'test@example.com';
      
      const mockUser: User = {
        id: '123',
        email,
        password: 'hashedpassword',
        roles: ['user'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (mockDbAdapter.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (mockDbAdapter.updateUser as jest.Mock).mockResolvedValue({
        ...mockUser,
        resetPasswordToken: expect.any(String),
        resetPasswordExpires: expect.any(Date),
      });
      
      // Act
      const result = await authService.forgotPassword(email);
      
      // Assert
      expect(mockDbAdapter.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockDbAdapter.updateUser).toHaveBeenCalledWith(mockUser.id, {
        resetPasswordToken: expect.any(String),
        resetPasswordExpires: expect.any(Date),
      });
      expect(result).toHaveProperty('resetToken');
      expect(typeof result.resetToken).toBe('string');
    });
    
    it('should throw an error if user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      
      (mockDbAdapter.getUserByEmail as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(authService.forgotPassword(email)).rejects.toThrow('User not found');
      expect(mockDbAdapter.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockDbAdapter.updateUser).not.toHaveBeenCalled();
    });
  });
  
  describe('resetPassword', () => {
    it('should reset the password with a valid token', async () => {
      // Arrange
      const token = 'validtoken';
      const newPassword = 'newpassword123';
      const hashedPassword = 'newhashedpassword';
      
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        password: 'oldhashed',
        roles: ['user'],
        isActive: true,
        resetPasswordToken: token,
        resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour in the future
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (mockDbAdapter.getUserByResetToken as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (mockDbAdapter.updateUser as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined,
      });
      
      // Act
      const result = await authService.resetPassword(token, newPassword);
      
      // Assert
      expect(mockDbAdapter.getUserByResetToken).toHaveBeenCalledWith(token);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 'salt');
      expect(mockDbAdapter.updateUser).toHaveBeenCalledWith(mockUser.id, {
        password: hashedPassword,
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined,
      });
      expect(result).toBe(true);
    });
    
    it('should throw an error if token is invalid', async () => {
      // Arrange
      const token = 'invalidtoken';
      const newPassword = 'newpassword123';
      
      (mockDbAdapter.getUserByResetToken as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(authService.resetPassword(token, newPassword)).rejects.toThrow('Invalid token');
      expect(mockDbAdapter.getUserByResetToken).toHaveBeenCalledWith(token);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockDbAdapter.updateUser).not.toHaveBeenCalled();
    });
    
    it('should throw an error if token is expired', async () => {
      // Arrange
      const token = 'expiredtoken';
      const newPassword = 'newpassword123';
      
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        password: 'oldhashed',
        roles: ['user'],
        isActive: true,
        resetPasswordToken: token,
        resetPasswordExpires: new Date(Date.now() - 3600000), // 1 hour in the past
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (mockDbAdapter.getUserByResetToken as jest.Mock).mockResolvedValue(mockUser);
      
      // Act & Assert
      await expect(authService.resetPassword(token, newPassword)).rejects.toThrow('Token expired');
      expect(mockDbAdapter.getUserByResetToken).toHaveBeenCalledWith(token);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockDbAdapter.updateUser).not.toHaveBeenCalled();
    });
  });
  
  describe('refreshToken', () => {
    it('should refresh tokens with a valid refresh token', async () => {
      // Arrange
      const refreshToken = 'validrefreshtoken';
      const userId = '123';
      
      const mockUser: User = {
        id: userId,
        email: 'test@example.com',
        password: 'hashedpassword',
        roles: ['user'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (jwt.verify as jest.Mock).mockReturnValue({ id: userId });
      (mockDbAdapter.getUserById as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValueOnce('newaccesstoken').mockReturnValueOnce('newrefreshtoken');
      
      // Act
      const result = await authService.refreshToken(refreshToken);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, mockConfig.refreshTokenSecret);
      expect(mockDbAdapter.getUserById).toHaveBeenCalledWith(userId);
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        token: 'newaccesstoken',
        refreshToken: 'newrefreshtoken',
      });
    });
    
    it('should throw an error if refresh token is invalid', async () => {
      // Arrange
      const refreshToken = 'invalidrefreshtoken';
      
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Act & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, mockConfig.refreshTokenSecret);
      expect(mockDbAdapter.getUserById).not.toHaveBeenCalled();
    });
    
    it('should throw an error if user not found', async () => {
      // Arrange
      const refreshToken = 'validrefreshtoken';
      const userId = '123';
      
      (jwt.verify as jest.Mock).mockReturnValue({ id: userId });
      (mockDbAdapter.getUserById as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, mockConfig.refreshTokenSecret);
      expect(mockDbAdapter.getUserById).toHaveBeenCalledWith(userId);
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
}); 