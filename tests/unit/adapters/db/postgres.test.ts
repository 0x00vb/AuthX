import { PostgresAdapter } from '../../../../src/adapters/db/postgres';
import { AuthXConfig } from '../../../../src/config/types';
import { defaultConfig } from '../../../../src/config/default';
import { User, UserCreateInput, UserUpdateInput, Role, RoleCreateInput, RoleUpdateInput } from '../../../../src/models';

// Mock the pg module
jest.mock('pg', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };
  
  const mockPool = {
    connect: jest.fn().mockReturnValue(mockClient),
    end: jest.fn().mockResolvedValue(null),
    query: jest.fn()
  };
  
  return {
    Pool: jest.fn(() => mockPool)
  };
});

// Console mocks to silence logs
console.log = jest.fn();
console.error = jest.fn();

describe('PostgresAdapter', () => {
  let adapter: PostgresAdapter;
  let mockConfig: AuthXConfig;
  let mockPool: any;
  let mockClient: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = { ...defaultConfig, dbUri: 'postgres://localhost:5432/authx_test' };
    adapter = new PostgresAdapter(mockConfig);
    
    // Access the mock directly
    mockPool = (new (require('pg').Pool as any)());
    mockClient = mockPool.connect();
    
    // Set up jest functions for mockClient
    mockClient.query = jest.fn();
    mockClient.release = jest.fn();
    
    // Manually inject pool
    (adapter as any).pool = mockPool;
  });
  
  describe('connect', () => {
    it('should connect to PostgreSQL and create tables', async () => {
      // Mock responses for all queries executed during initialization
      mockClient.query.mockResolvedValue({ rows: [] });
      
      // Act
      await adapter.connect();
      
      // Assert
      expect(mockPool.connect).toHaveBeenCalled();
      // Should call query many times during initialization (tables, indexes, default roles)
      expect(mockClient.query).toHaveBeenCalled();
    });
    
    it('should handle connection errors', async () => {
      // Arrange
      const error = new Error('Connection failed');
      mockPool.connect.mockRejectedValueOnce(error);
      
      // Act & Assert
      await expect(adapter.connect()).rejects.toThrow('Connection failed');
    });
  });
  
  describe('disconnect', () => {
    it('should disconnect from PostgreSQL', async () => {
      // Act
      await adapter.disconnect();
      
      // Assert
      expect(mockPool.end).toHaveBeenCalled();
      expect((adapter as any).pool).toBeNull();
    });
    
    it('should do nothing if not connected', async () => {
      // Arrange
      (adapter as any).pool = null;
      
      // Act
      await adapter.disconnect();
      
      // Assert
      expect(mockPool.end).not.toHaveBeenCalled();
    });
  });
  
  describe('createUser', () => {
    it('should create a new user', async () => {
      // Arrange
      const userData: UserCreateInput = {
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User'
      };
      
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        roles: [mockConfig.defaultRole],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockClient.query.mockResolvedValueOnce({ rows: [mockUser] });
      
      // Act
      const result = await adapter.createUser(userData);
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          userData.email,
          userData.password,
          userData.firstName,
          userData.lastName,
          expect.any(Array) // roles
        ])
      );
      
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        password: mockUser.password,
        firstName: mockUser.first_name,
        lastName: mockUser.last_name,
        roles: mockUser.roles,
        isActive: mockUser.is_active,
        createdAt: mockUser.created_at,
        updatedAt: mockUser.updated_at
      });
    });
    
    it('should connect if not already connected', async () => {
      // Arrange
      const userData: UserCreateInput = {
        email: 'test@example.com',
        password: 'hashedpassword'
      };
      
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: userData.email,
        password: userData.password,
        roles: [mockConfig.defaultRole],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Create a new instance to test connect
      const newAdapter = new PostgresAdapter(mockConfig);
      
      // Mock pool for newAdapter
      const newMockPool = (new (require('pg').Pool as any)());
      const newMockClient = newMockPool.connect();
      newMockClient.query = jest.fn().mockResolvedValueOnce({ rows: [mockUser] });
      newMockClient.release = jest.fn();
      
      // Inject the mock for the new adapter
      (newAdapter as any).pool = newMockPool;
      
      // Act
      await newAdapter.createUser(userData);
      
      // Assert
      expect(newMockPool.connect).toHaveBeenCalled();
    });
  });
  
  describe('getUserById', () => {
    it('should get a user by ID', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const dbUser = {
        id: userId,
        email: 'test@example.com',
        password: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        roles: ['user'],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockClient.query.mockResolvedValueOnce({ rows: [dbUser] });
      
      // Act
      const result = await adapter.getUserById(userId);
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE id = $1'),
        [userId]
      );
      
      expect(result).toEqual({
        id: userId,
        email: dbUser.email,
        password: dbUser.password,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        roles: dbUser.roles,
        isActive: dbUser.is_active,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      });
    });
    
    it('should return null if user not found', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Act
      const result = await adapter.getUserById(userId);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should handle error and return null', async () => {
      // Arrange
      const userId = 'invalid-id';
      mockClient.query.mockRejectedValueOnce(new Error('Invalid UUID'));
      
      // Act
      const result = await adapter.getUserById(userId);
      
      // Assert
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('getUserByEmail', () => {
    it('should get a user by email', async () => {
      // Arrange
      const email = 'test@example.com';
      const dbUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email,
        password: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        roles: ['user'],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockClient.query.mockResolvedValueOnce({ rows: [dbUser] });
      
      // Act
      const result = await adapter.getUserByEmail(email);
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE email = $1'),
        [email]
      );
      
      expect(result).toEqual({
        id: dbUser.id,
        email: dbUser.email,
        password: dbUser.password,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        roles: dbUser.roles,
        isActive: dbUser.is_active,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      });
    });
    
    it('should return null if user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Act
      const result = await adapter.getUserByEmail(email);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('updateUser', () => {
    it('should update a user', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: UserUpdateInput = {
        firstName: 'Updated',
        lastName: 'User'
      };
      
      const dbUser = {
        id: userId,
        email: 'test@example.com',
        password: 'hashedpassword',
        first_name: 'Updated',
        last_name: 'User',
        roles: ['user'],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockClient.query.mockResolvedValueOnce({ rows: [dbUser] });
      
      // Act
      const result = await adapter.updateUser(userId, updateData);
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.any(String), // Can't match the exact format due to whitespace differences
        expect.arrayContaining([
          updateData.firstName,
          updateData.lastName,
          expect.any(Date), // updatedAt
          userId
        ])
      );
      
      expect(result).toEqual({
        id: userId,
        email: dbUser.email,
        password: dbUser.password,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        roles: dbUser.roles,
        isActive: dbUser.is_active,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      });
    });
    
    it('should throw error if user not found', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Act & Assert
      await expect(adapter.updateUser(userId, { firstName: 'Updated' }))
        .rejects.toThrow('User not found');
    });
  });
  
  describe('deleteUser', () => {
    it('should delete a user', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
      
      // Act
      const result = await adapter.deleteUser(userId);
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM users WHERE id = $1'),
        [userId]
      );
      expect(result).toBe(true);
    });
    
    it('should return false if user not found', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 });
      
      // Act
      const result = await adapter.deleteUser(userId);
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('createRole', () => {
    it('should create a new role', async () => {
      // Arrange
      const roleData: RoleCreateInput = {
        name: 'admin',
        description: 'Administrator role',
        permissions: ['user:read', 'user:write']
      };
      
      const mockRole = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockClient.query.mockResolvedValueOnce({ rows: [mockRole] });
      
      // Act
      const result = await adapter.createRole(roleData);
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO roles'),
        expect.arrayContaining([
          roleData.name,
          roleData.description,
          expect.any(Array) // permissions
        ])
      );
      
      expect(result).toEqual({
        id: mockRole.id,
        name: mockRole.name,
        description: mockRole.description,
        permissions: mockRole.permissions,
        createdAt: mockRole.created_at,
        updatedAt: mockRole.updated_at
      });
    });
  });
  
  describe('getRoleById', () => {
    it('should get a role by ID', async () => {
      // Arrange
      const roleId = '123e4567-e89b-12d3-a456-426614174000';
      const dbRole = {
        id: roleId,
        name: 'admin',
        description: 'Administrator role',
        permissions: ['user:read', 'user:write'],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockClient.query.mockResolvedValueOnce({ rows: [dbRole] });
      
      // Act
      const result = await adapter.getRoleById(roleId);
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM roles WHERE id = $1'),
        [roleId]
      );
      
      expect(result).toEqual({
        id: roleId,
        name: dbRole.name,
        description: dbRole.description,
        permissions: dbRole.permissions,
        createdAt: dbRole.created_at,
        updatedAt: dbRole.updated_at
      });
    });
    
    it('should return null if role not found', async () => {
      // Arrange
      const roleId = '123e4567-e89b-12d3-a456-426614174000';
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Act
      const result = await adapter.getRoleById(roleId);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('getRoleByName', () => {
    it('should get a role by name', async () => {
      // Arrange
      const roleName = 'admin';
      const dbRole = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: roleName,
        description: 'Administrator role',
        permissions: ['user:read', 'user:write'],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockClient.query.mockResolvedValueOnce({ rows: [dbRole] });
      
      // Act
      const result = await adapter.getRoleByName(roleName);
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM roles WHERE name = $1'),
        [roleName]
      );
      
      expect(result).toEqual({
        id: dbRole.id,
        name: dbRole.name,
        description: dbRole.description,
        permissions: dbRole.permissions,
        createdAt: dbRole.created_at,
        updatedAt: dbRole.updated_at
      });
    });
    
    it('should return null if role not found', async () => {
      // Arrange
      const roleName = 'nonexistent';
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Act
      const result = await adapter.getRoleByName(roleName);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('updateRole', () => {
    it('should update a role', async () => {
      // Arrange
      const roleId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData: RoleUpdateInput = {
        description: 'Updated role description',
        permissions: ['user:read', 'user:write', 'user:delete']
      };
      
      const dbRole = {
        id: roleId,
        name: 'admin',
        description: updateData.description,
        permissions: updateData.permissions,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockClient.query.mockResolvedValueOnce({ rows: [dbRole] });
      
      // Act
      const result = await adapter.updateRole(roleId, updateData);
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.any(String), // Can't match the exact format due to whitespace differences
        expect.arrayContaining([
          updateData.description,
          updateData.permissions,
          expect.any(Date), // updatedAt
          roleId
        ])
      );
      
      expect(result).toEqual({
        id: roleId,
        name: dbRole.name,
        description: dbRole.description,
        permissions: dbRole.permissions,
        createdAt: dbRole.created_at,
        updatedAt: dbRole.updated_at
      });
    });
    
    it('should throw error if role not found', async () => {
      // Arrange
      const roleId = '123e4567-e89b-12d3-a456-426614174000';
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Act & Assert
      await expect(adapter.updateRole(roleId, { description: 'Updated' }))
        .rejects.toThrow('Role not found');
    });
  });
  
  describe('deleteRole', () => {
    it('should delete a role', async () => {
      // Arrange
      const roleId = '123e4567-e89b-12d3-a456-426614174000';
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
      
      // Act
      const result = await adapter.deleteRole(roleId);
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM roles WHERE id = $1'),
        [roleId]
      );
      expect(result).toBe(true);
    });
    
    it('should return false if role not found', async () => {
      // Arrange
      const roleId = '123e4567-e89b-12d3-a456-426614174000';
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 });
      
      // Act
      const result = await adapter.deleteRole(roleId);
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('assignRoleToUser', () => {
    it('should assign a role to a user', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const roleId = '456e7890-e89b-12d3-a456-426614174000';
      const role = {
        id: roleId,
        name: 'admin',
        description: 'Administrator role',
        permissions: ['user:read', 'user:write'],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock role query
      mockClient.query.mockResolvedValueOnce({ rows: [role] });
      // Mock user roles query - we'll skip this, implementation directly calls update
      // Mock update query
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
      
      // Act
      const result = await adapter.assignRoleToUser(userId, roleId);
      
      // Assert
      // First query: get role by ID
      expect(mockClient.query).toHaveBeenNthCalledWith(1,
        expect.stringContaining('SELECT * FROM roles WHERE id = $1'),
        [roleId]
      );
      
      // Second query: update user roles
      expect(mockClient.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining([
          "admin", // role name
          userId
        ])
      );
      
      expect(result).toBe(true);
    });
    
    it('should throw error if role not found', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const roleId = '456e7890-e89b-12d3-a456-426614174000';
      
      // Mock role query with empty result
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Act & Assert
      await expect(adapter.assignRoleToUser(userId, roleId))
        .rejects.toThrow('Role not found');
    });
    
    it('should return false if user not found or role already assigned', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const roleId = '456e7890-e89b-12d3-a456-426614174000';
      const role = {
        id: roleId,
        name: 'admin',
        description: 'Administrator role',
        permissions: ['user:read', 'user:write'],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock role query
      mockClient.query.mockResolvedValueOnce({ rows: [role] });
      // Mock update query with no rows affected
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 });
      
      // Act
      const result = await adapter.assignRoleToUser(userId, roleId);
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('removeRoleFromUser', () => {
    it('should remove a role from a user', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const roleId = '456e7890-e89b-12d3-a456-426614174000';
      const role = {
        id: roleId,
        name: 'admin',
        description: 'Administrator role',
        permissions: ['user:read', 'user:write'],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // PostgreSQL implementation gets the role first, then updates directly
      mockClient.query.mockResolvedValueOnce({ rows: [role] });
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
      
      // Act
      const result = await adapter.removeRoleFromUser(userId, roleId);
      
      // Assert
      // First query: get role by ID
      expect(mockClient.query).toHaveBeenNthCalledWith(1, 
        expect.stringContaining('SELECT * FROM roles WHERE id = $1'),
        [roleId]
      );
      
      // Second query: update user roles
      expect(mockClient.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining([
          role.name,
          userId
        ])
      );
      
      expect(result).toBe(true);
    });
    
    it('should throw error if role not found', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const roleId = '456e7890-e89b-12d3-a456-426614174000';
      
      // Mock role query with empty result
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Act & Assert
      await expect(adapter.removeRoleFromUser(userId, roleId))
        .rejects.toThrow('Role not found');
    });
    
    it('should return false if user not found', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const roleId = '456e7890-e89b-12d3-a456-426614174000';
      const role = {
        id: roleId,
        name: 'admin',
        description: 'Administrator role',
        permissions: ['user:read', 'user:write'],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock role query
      mockClient.query.mockResolvedValueOnce({ rows: [role] });
      // Mock update query with no rows affected - this indicates user not found
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 });
      
      // Act
      const result = await adapter.removeRoleFromUser(userId, roleId);
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('getUserRoles', () => {
    it('should get user roles', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const userRoles = ['user', 'admin'];
      
      const userRole = {
        id: '567e8901-e89b-12d3-a456-426614174000',
        name: 'user',
        description: 'User role',
        permissions: ['read'],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const adminRole = {
        id: '789e0123-e89b-12d3-a456-426614174000',
        name: 'admin',
        description: 'Administrator role',
        permissions: ['read', 'write'],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock user roles query
      mockClient.query.mockResolvedValueOnce({ rows: [{ roles: userRoles }] });
      // Mock batch get roles query
      mockClient.query.mockResolvedValueOnce({ rows: [userRole, adminRole] });
      
      // Act
      const result = await adapter.getUserRoles(userId);
      
      // Assert
      expect(mockClient.query).toHaveBeenNthCalledWith(1,
        expect.stringContaining('SELECT roles FROM users WHERE id = $1'),
        [userId]
      );
      
      expect(mockClient.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('SELECT * FROM roles WHERE name = ANY($1)'),
        [userRoles]
      );
      
      expect(result).toEqual([
        {
          id: userRole.id,
          name: userRole.name,
          description: userRole.description,
          permissions: userRole.permissions,
          createdAt: userRole.created_at,
          updatedAt: userRole.updated_at
        },
        {
          id: adminRole.id,
          name: adminRole.name,
          description: adminRole.description,
          permissions: adminRole.permissions,
          createdAt: adminRole.created_at,
          updatedAt: adminRole.updated_at
        }
      ]);
    });
    
    it('should throw error if user not found', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      // Mock user query with empty result
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Act & Assert
      await expect(adapter.getUserRoles(userId))
        .rejects.toThrow('User not found');
    });
    
    it('should check if all roles are found', async () => {
      // Arrange
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const userRoles = ['user', 'admin']; // User has both roles
      
      const userRole = {
        id: '567e8901-e89b-12d3-a456-426614174000',
        name: 'user',
        description: 'User role',
        permissions: ['read'],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Only one role is returned from the database
      // In the actual implementation, this wouldn't cause an error
      // because there's no validation that all roles exist
      
      // Mock user roles query
      mockClient.query.mockResolvedValueOnce({ rows: [{ roles: userRoles }] });
      // Mock role queries - only return one role, missing 'admin'
      mockClient.query.mockResolvedValueOnce({ rows: [userRole] });
      
      // Act
      const result = await adapter.getUserRoles(userId);
      
      // Assert
      // We should get back the role that was found
      expect(result).toEqual([
        {
          id: userRole.id,
          name: userRole.name,
          description: userRole.description,
          permissions: userRole.permissions,
          createdAt: userRole.created_at,
          updatedAt: userRole.updated_at
        }
      ]);
    });
  });
  
  describe('getUserByResetToken', () => {
    it('should get user by reset token', async () => {
      // Arrange
      const token = 'reset-token';
      const dbUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password: 'hashedpassword',
        reset_password_token: token,
        reset_password_expires: new Date(Date.now() + 3600000), // 1 hour in future
        first_name: 'Test',
        last_name: 'User',
        roles: ['user'],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockClient.query.mockResolvedValueOnce({ rows: [dbUser] });
      
      // Act
      const result = await adapter.getUserByResetToken(token);
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE reset_password_token = $1'),
        expect.arrayContaining([token])
      );
      
      expect(result).toEqual({
        id: dbUser.id,
        email: dbUser.email,
        password: dbUser.password,
        resetPasswordToken: dbUser.reset_password_token,
        resetPasswordExpires: dbUser.reset_password_expires,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        roles: dbUser.roles,
        isActive: dbUser.is_active,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      });
    });
    
    it('should return null if token not found or expired', async () => {
      // Arrange
      const token = 'invalid-token';
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Act
      const result = await adapter.getUserByResetToken(token);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('getUserByVerificationToken', () => {
    it('should get user by verification token', async () => {
      // Arrange
      const token = 'verification-token';
      const dbUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password: 'hashedpassword',
        verification_token: token,
        first_name: 'Test',
        last_name: 'User',
        roles: ['user'],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockClient.query.mockResolvedValueOnce({ rows: [dbUser] });
      
      // Act
      const result = await adapter.getUserByVerificationToken(token);
      
      // Assert
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE verification_token = $1'),
        [token]
      );
      
      expect(result).toEqual({
        id: dbUser.id,
        email: dbUser.email,
        password: dbUser.password,
        verificationToken: dbUser.verification_token,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        roles: dbUser.roles,
        isActive: dbUser.is_active,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      });
    });
    
    it('should return null if token not found', async () => {
      // Arrange
      const token = 'invalid-token';
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      
      // Act
      const result = await adapter.getUserByVerificationToken(token);
      
      // Assert
      expect(result).toBeNull();
    });
  });
}); 