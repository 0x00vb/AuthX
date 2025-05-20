import request from 'supertest';
import { AuthX } from '../../src';
import { User } from '../../src/models';
import { Express } from 'express';
import { MockDbAdapter } from '../mocks/mockDbAdapter';
import { getDbAdapter } from '../../src/adapters/db';

// Mock the getDbAdapter function to return our mock adapter
jest.mock('../../src/adapters/db', () => ({
  getDbAdapter: jest.fn()
}));

describe('Auth Routes', () => {
  let authX: AuthX;
  let app: Express;
  let mockAdapter: MockDbAdapter;
  
  beforeAll(() => {
    // Create mock adapter
    mockAdapter = new MockDbAdapter();
    (getDbAdapter as jest.Mock).mockReturnValue(mockAdapter);
    
    // Initialize AuthX with test configuration
    authX = new AuthX({
      dbType: 'mongodb',
      dbUri: 'mongodb://localhost:27017/authx_test',
      jwtSecret: 'test-jwt-secret',
      refreshTokenSecret: 'test-refresh-token-secret',
      jwtExpiresIn: '1h',
      refreshTokenExpiresIn: '7d',
      defaultRole: 'user'
    });
    
    app = authX.getApp();
    // Mount the router at the app level
    app.use('/auth', authX.getRouter());
  });
  
  describe('POST /register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });
    
    it('should return 400 with validation errors for invalid data', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        password: '123', // Too short
      };
      
      const response = await request(app)
        .post('/auth/register')
        .send(invalidUserData)
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toBeInstanceOf(Array);
    });
  });
  
  describe('POST /login', () => {
    beforeAll(async () => {
      // Register a user for login tests
      await request(app)
        .post('/auth/register')
        .send({
          email: 'login-test@example.com',
          password: 'password123',
        });
    });
    
    it('should login a registered user', async () => {
      const loginData = {
        email: 'login-test@example.com',
        password: 'password123',
      };
      
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(loginData.email);
    });
    
    it('should return 401 for invalid credentials', async () => {
      const invalidLoginData = {
        email: 'login-test@example.com',
        password: 'wrong-password',
      };
      
      await request(app)
        .post('/auth/login')
        .send(invalidLoginData)
        .expect(401);
    });
  });
  
  // Add more tests for forgot-password, reset-password, refresh-token, etc.
}); 