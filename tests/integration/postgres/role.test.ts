import request from 'supertest';
import { Express } from 'express';
import { createTestAuthX, setupPostgresForTests, cleanupPostgresForTests, truncateAllTables, createAdminUser } from '../../helpers/postgres-test';
import { AuthX } from '../../../src';

describe('Role Routes with PostgreSQL', () => {
  let authX: AuthX;
  let app: Express;
  let adminToken: string;
  let userToken: string;
  
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
    
    // Create admin user using the helper
    const { adminToken: token } = await createAdminUser(app);
    adminToken = token;
    
    // Register a regular user
    const userResponse = await request(app)
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'password123',
        firstName: 'Regular',
        lastName: 'User',
      });
    
    // Get the user token
    userToken = userResponse.body.token;
  });
  
  describe('POST /auth/role', () => {
    it('should create a new role when authenticated as admin', async () => {
      const roleData = {
        name: 'editor',
        description: 'Editor role',
        permissions: ['create:post', 'edit:post', 'delete:post']
      };
      
      const response = await request(app)
        .post('/auth/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(roleData)
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(roleData.name);
      expect(response.body.description).toBe(roleData.description);
      expect(response.body.permissions).toEqual(expect.arrayContaining(roleData.permissions));
    });
    
    it('should return 403 when not authenticated as admin', async () => {
      const roleData = {
        name: 'editor',
        description: 'Editor role',
        permissions: ['create:post', 'edit:post', 'delete:post']
      };
      
      await request(app)
        .post('/auth/role')
        .set('Authorization', `Bearer ${userToken}`)
        .send(roleData)
        .expect(403);
    });
  });
  
  describe('GET /auth/role/:id', () => {
    let roleId: string;
    
    beforeEach(async () => {
      // Create a test role first
      const response = await request(app)
        .post('/auth/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'viewer',
          description: 'Viewer role',
          permissions: ['view:content']
        });
      
      roleId = response.body.id;
    });
    
    it('should get a role by ID when authenticated as admin', async () => {
      const response = await request(app)
        .get(`/auth/role/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('id', roleId);
      expect(response.body.name).toBe('viewer');
      expect(response.body.permissions).toEqual(expect.arrayContaining(['view:content']));
    });
    
    it('should return 403 when not authenticated as admin', async () => {
      await request(app)
        .get(`/auth/role/${roleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
    
    it('should return 404 when role does not exist', async () => {
      await request(app)
        .get('/auth/role/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
  
  describe('PUT /auth/role/:id', () => {
    let roleId: string;
    
    beforeEach(async () => {
      // Create a test role first
      const response = await request(app)
        .post('/auth/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'moderator',
          description: 'Moderator role',
          permissions: ['moderate:content']
        });
      
      roleId = response.body.id;
    });
    
    it('should update a role when authenticated as admin', async () => {
      const updatedRoleData = {
        description: 'Updated moderator role',
        permissions: ['moderate:content', 'delete:content']
      };
      
      const response = await request(app)
        .put(`/auth/role/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedRoleData)
        .expect(200);
      
      expect(response.body).toHaveProperty('id', roleId);
      expect(response.body.name).toBe('moderator'); // Name shouldn't change
      expect(response.body.description).toBe(updatedRoleData.description);
      expect(response.body.permissions).toEqual(expect.arrayContaining(updatedRoleData.permissions));
    });
    
    it('should return 403 when not authenticated as admin', async () => {
      await request(app)
        .put(`/auth/role/${roleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ description: 'Attempted update' })
        .expect(403);
    });
  });
  
  describe('DELETE /auth/role/:id', () => {
    let roleId: string;
    
    beforeEach(async () => {
      // Create a test role first
      const response = await request(app)
        .post('/auth/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'guest',
          description: 'Guest role',
          permissions: ['read:public']
        });
      
      roleId = response.body.id;
    });
    
    it('should delete a role when authenticated as admin', async () => {
      await request(app)
        .delete(`/auth/role/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      // Verify the role no longer exists
      await request(app)
        .get(`/auth/role/${roleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
    
    it('should return 403 when not authenticated as admin', async () => {
      await request(app)
        .delete(`/auth/role/${roleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
}); 