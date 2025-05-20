import request from 'supertest';
import { Express } from 'express';
import { createTestAuthX, setupPostgresForTests, cleanupPostgresForTests, truncateAllTables, getAdapter, getUserByEmail, updateUser } from '../../helpers/postgres-test';
import { AuthX } from '../../../src';
import bcrypt from 'bcrypt';

describe('Auth Routes with PostgreSQL', () => {
  let authX: AuthX;
  let app: Express;
  
  beforeAll(async () => {
    // Set up the PostgreSQL database
    await setupPostgresForTests();
    
    // Initialize AuthX with PostgreSQL config
    authX = createTestAuthX();
    app = authX.getApp();
    
    // Make authX accessible on the app for the helper functions
    (app as any).authX = authX;
    
    // Mount the router at the app level
    app.use('/auth', authX.getRouter());
  });
  
  afterAll(async () => {
    // Clean up the PostgreSQL database
    await cleanupPostgresForTests();
  });
  
  beforeEach(async () => {
    // Reset database tables before each test
    await truncateAllTables();
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
    beforeEach(async () => {
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
  
  describe('POST /forgot-password', () => {
    beforeEach(async () => {
      // Register a user for forgot-password tests
      await request(app)
        .post('/auth/register')
        .send({
          email: 'forgot-password@example.com',
          password: 'password123',
        });
    });
    
    it('should generate a reset token for a valid email', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'forgot-password@example.com' })
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Password reset email sent');
    });
    
    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent' }) // Invalid email format
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
    });
    
    it('should return 400 for non-existent email', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('User not found');
    });
  });
  
  describe('POST /reset-password', () => {
    let resetToken: string;
    const userEmail = 'reset-password@example.com';
    let userId: string;
    
    beforeEach(async () => {
      // Register a user for reset-password tests
      const registerResponse = await request(app)
        .post('/auth/register')
        .send({
          email: userEmail,
          password: 'password123',
        });
      
      userId = registerResponse.body.user.id;
      
      // Create a reset token directly - do not hash it
      resetToken = 'reset-token-test';
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1); // 1 hour from now
      
      // Get the adapter and update the user with reset token
      const adapter = getAdapter(authX);
      await adapter.updateUser(userId, {
        resetPasswordToken: resetToken, // Store token directly
        resetPasswordExpires: expiration
      });
    });
    
    it('should reset the password with a valid token', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123',
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('successful');
      
      // Sleep briefly to allow the database update to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to login with the new password
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: userEmail,
          password: 'newpassword123',
        });
      
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
    });
    
    it('should return 400 for invalid token', async () => {
      await request(app)
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'newpassword123',
        })
        .expect(400);
    });
  });
  
  describe('POST /refresh-token', () => {
    let refreshToken: string;
    
    beforeEach(async () => {
      // Register and login a user to get refresh token
      await request(app)
        .post('/auth/register')
        .send({
          email: 'refresh-test@example.com',
          password: 'password123',
        });
      
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'refresh-test@example.com',
          password: 'password123',
        });
      
      refreshToken = loginResponse.body.refreshToken;
    });
    
    it('should return a new token with valid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);
      
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });
    
    it('should return 401 for invalid refresh token', async () => {
      await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });
}); 