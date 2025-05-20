import { AuthXMiddleware } from '../../../src/middleware';
import { User } from '../../../src/models';
import { AuthRequest } from '../../../src/middleware/types';
import { Response, NextFunction } from 'express';
import { DbAdapter } from '../../../src/adapters/db/adapter';
import { defaultConfig } from '../../../src/config/default';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('jsonwebtoken');

// Mock DB adapter
const mockDbAdapter: Partial<DbAdapter> = {
  getUserById: jest.fn(),
};

describe('AuthXMiddleware', () => {
  let authMiddleware: AuthXMiddleware;
  const mockConfig = { ...defaultConfig };
  
  // Mock Express objects
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    authMiddleware = new AuthXMiddleware(mockConfig, mockDbAdapter as DbAdapter);
    
    mockRequest = {
      headers: {},
      user: undefined,
      token: undefined,
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
  });
  
  describe('authenticate', () => {
    it('should call next if no token is provided and throwError is false', async () => {
      // Arrange
      mockRequest.headers = { authorization: undefined };
      
      // Act
      await authMiddleware.authenticate()(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
    
    it('should return 401 if no token is provided and throwError is true', async () => {
      // Arrange
      mockRequest.headers = { authorization: undefined };
      
      // Act
      await authMiddleware.authenticate({ throwError: true })(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should attach user to request if token is valid', async () => {
      // Arrange
      const token = 'valid.token.here';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      
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
      
      // Act
      await authMiddleware.authenticate()(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, mockConfig.jwtSecret);
      expect(mockDbAdapter.getUserById).toHaveBeenCalledWith(userId);
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockRequest.token).toEqual(token);
      expect(mockNext).toHaveBeenCalled();
    });
    
    it('should return 401 if token is invalid and throwError is true', async () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer invalid.token' };
      
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Act
      await authMiddleware.authenticate({ throwError: true })(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should return 401 if user not found and throwError is true', async () => {
      // Arrange
      const token = 'valid.token.here';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      
      (jwt.verify as jest.Mock).mockReturnValue({ id: '123' });
      (mockDbAdapter.getUserById as jest.Mock).mockResolvedValue(null);
      
      // Act
      await authMiddleware.authenticate({ throwError: true })(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
  
  describe('hasRole', () => {
    it('should call next if user has the required role', () => {
      // Arrange
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedpassword',
        roles: ['user', 'admin'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.user = mockUser;
      
      // Act
      authMiddleware.hasRole('admin')(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
    
    it('should return 403 if user does not have the required role and throwError is true', () => {
      // Arrange
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedpassword',
        roles: ['user'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.user = mockUser;
      
      // Act
      authMiddleware.hasRole('admin', { throwError: true })(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User does not have required role: admin' });
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should return 401 if user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;
      
      // Act
      authMiddleware.hasRole('admin')(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
  
  describe('hasAnyRole', () => {
    it('should call next if user has any of the required roles', () => {
      // Arrange
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedpassword',
        roles: ['user', 'editor'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.user = mockUser;
      
      // Act
      authMiddleware.hasAnyRole(['admin', 'editor'])(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
    
    it('should return 403 if user does not have any required role and throwError is true', () => {
      // Arrange
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedpassword',
        roles: ['user'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.user = mockUser;
      
      // Act
      authMiddleware.hasAnyRole(['admin', 'editor'], { throwError: true })(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User does not have any of the required roles: admin, editor' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
  
  describe('hasAllRoles', () => {
    it('should call next if user has all required roles', () => {
      // Arrange
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedpassword',
        roles: ['user', 'editor', 'admin'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.user = mockUser;
      
      // Act
      authMiddleware.hasAllRoles(['user', 'editor'])(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
    
    it('should return 403 if user does not have all required roles and throwError is true', () => {
      // Arrange
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedpassword',
        roles: ['user', 'editor'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockRequest.user = mockUser;
      
      // Act
      authMiddleware.hasAllRoles(['user', 'admin'], { throwError: true })(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User does not have all required roles: user, admin' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 