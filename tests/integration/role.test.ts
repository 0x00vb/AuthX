import request from 'supertest';
import { AuthX } from '../../src';
import { Express } from 'express';
import { MockDbAdapter } from '../mocks/mockDbAdapter';
import { getDbAdapter } from '../../src/adapters/db';
import { Role } from '../../src/models';

// Mock the getDbAdapter function to return our mock adapter
jest.mock('../../src/adapters/db', () => ({
  getDbAdapter: jest.fn()
}));

describe('Role Routes', () => {
  let authX: AuthX;
  let app: Express;
  let mockAdapter: MockDbAdapter;
  let adminToken: string;
  
  beforeAll(async () => {
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
    app.use('/auth', authX.getRouter());
    
    // Create the admin role first
    const adminRole = await mockAdapter.createRole({
      name: 'admin',
      description: 'Administrator role',
      permissions: ['*']
    });
    
    // Register an admin user and get a token
    const adminData = {
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      roles: ['admin']
    };
    
    const admin = await mockAdapter.createUser(adminData);
    
    // Use the auth service directly to generate a token
    const response = await request(app)
      .post('/auth/login')
      .send({ email: adminData.email, password: adminData.password });
    
    adminToken = response.body.token;
    
    // If the login fails (since we're using a mock adapter), manually create a JWT
    if (!adminToken) {
      const jwt = require('jsonwebtoken');
      adminToken = jwt.sign(
        { id: admin.id },
        authX.getConfig().jwtSecret,
        { expiresIn: '1h' }
      );
    }
  });
  
  describe('POST /role', () => {
    it('should create a new role', async () => {
      const roleData = {
        name: 'editor',
        description: 'Editor role',
        permissions: ['content:read', 'content:write']
      };
      
      const response = await request(app)
        .post('/auth/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(roleData)
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(roleData.name);
      expect(response.body.description).toBe(roleData.description);
      expect(response.body.permissions).toEqual(roleData.permissions);
    });
    
    it('should return 400 if role already exists', async () => {
      const roleData = {
        name: 'editor',
        description: 'Duplicate role'
      };
      
      await request(app)
        .post('/auth/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(roleData)
        .expect(400);
    });
  });
  
  describe('GET /role/:id', () => {
    let roleId: string;
    
    beforeAll(async () => {
      // Create a role directly in the mock adapter
      const role = await mockAdapter.createRole({
        name: 'viewer',
        description: 'Viewer role',
        permissions: ['content:read']
      });
      
      roleId = role.id;
    });
    
    it('should get a role by id', async () => {
      const response = await request(app)
        .get(`/auth/role/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body.id).toBe(roleId);
      expect(response.body.name).toBe('viewer');
    });
    
    it('should return 404 if role not found', async () => {
      await request(app)
        .get('/auth/role/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
  
  describe('PUT /role/:id', () => {
    let roleId: string;
    
    beforeAll(async () => {
      // Create a role directly in the mock adapter
      const role = await mockAdapter.createRole({
        name: 'subscriber',
        description: 'Subscriber role',
        permissions: ['content:read']
      });
      
      roleId = role.id;
    });
    
    it('should update a role', async () => {
      const updateData = {
        description: 'Updated subscriber role',
        permissions: ['content:read', 'profile:read']
      };
      
      const response = await request(app)
        .put(`/auth/role/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body.id).toBe(roleId);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.permissions).toEqual(updateData.permissions);
    });
    
    it('should return 404 if role not found', async () => {
      await request(app)
        .put('/auth/role/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated description' })
        .expect(404);
    });
  });
  
  describe('DELETE /role/:id', () => {
    let roleId: string;
    
    beforeAll(async () => {
      // Create a role directly in the mock adapter
      const role = await mockAdapter.createRole({
        name: 'temporary',
        description: 'Temporary role to delete',
        permissions: []
      });
      
      roleId = role.id;
    });
    
    it('should delete a role', async () => {
      await request(app)
        .delete(`/auth/role/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      // Verify role is deleted
      await request(app)
        .get(`/auth/role/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
    
    it('should return 404 if role not found', async () => {
      await request(app)
        .delete('/auth/role/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
}); 