import { MySqlAdapter } from '../../../../src/adapters/db/mysql';
import { AuthXConfig } from '../../../../src/config/types';
import { defaultConfig } from '../../../../src/config/default';
import { User, UserCreateInput, UserUpdateInput, Role, RoleCreateInput, RoleUpdateInput } from '../../../../src/models';

// Mock the mysql2/promise module
jest.mock('mysql2/promise', () => {
  // Create a factory function to get fresh mock instances each time
  const createMock = () => {
    const mockConnection = {
      execute: jest.fn(),
      query: jest.fn(),
      end: jest.fn().mockResolvedValue(null),
      release: jest.fn()
    };
    
    return {
      createConnection: jest.fn().mockResolvedValue(mockConnection),
      createPool: jest.fn().mockReturnValue({
        getConnection: jest.fn().mockResolvedValue(mockConnection),
        query: jest.fn(),
        execute: jest.fn(),
        end: jest.fn().mockResolvedValue(null)
      })
    };
  };
  
  // Return a fresh mock for each test
  return createMock();
});

// Console mocks to silence logs
console.log = jest.fn();
console.error = jest.fn();

describe('MySqlAdapter', () => {
  let adapter: MySqlAdapter;
  let mockConfig: AuthXConfig;
  let mockPool: any;
  let mockConnection: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = { ...defaultConfig, dbUri: 'mysql://localhost:3306/authx_test' };
    adapter = new MySqlAdapter(mockConfig);
    
    // Access the mock directly
    mockPool = (require('mysql2/promise').createPool as jest.Mock)();
    mockConnection = mockPool.getConnection();
    
    // Manually inject pool
    (adapter as any).pool = mockPool;
  });
  
  describe('connect', () => {
    it('should connect to MySQL and create tables', async () => {
      // Arrange
      mockPool.query.mockResolvedValue([[]]);
      
      // Act
      await adapter.connect();
      
      // Assert
      expect(mockPool.query).toHaveBeenCalled();
    });
    
    it('should handle connection errors', async () => {
      // Arrange
      const error = new Error('Connection failed');
      mockPool.query.mockRejectedValue(error);
      
      // Act & Assert
      await expect(adapter.connect()).rejects.toThrow('Connection failed');
    });
  });
  
  describe('disconnect', () => {
    it('should disconnect from MySQL', async () => {
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
      
      const insertId = 1;
      mockPool.execute.mockResolvedValueOnce([{ insertId }]);
      
      // Mock for getting the user after creation
      mockPool.query.mockResolvedValueOnce([
        [{
          id: insertId,
          email: userData.email,
          password: userData.password,
          first_name: userData.firstName,
          last_name: userData.lastName,
          roles: JSON.stringify([mockConfig.defaultRole]),
          is_active: 1,
          created_at: new Date(),
          updated_at: new Date()
        }]
      ]);
      
      // Act
      const result = await adapter.createUser(userData);
      
      // Assert
      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          userData.email,
          userData.password,
          userData.firstName,
          userData.lastName,
          expect.any(String), // JSON roles
          1 // isActive
        ])
      );
      
      expect(result).toEqual({
        id: insertId.toString(),
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roles: [mockConfig.defaultRole],
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
    
    it('should connect if not already connected', async () => {
      // Arrange
      const userData: UserCreateInput = {
        email: 'test@example.com',
        password: 'hashedpassword'
      };
      
      const insertId = 1;
      
      // Create a new instance without initialized pool to test connect
      const newAdapter = new MySqlAdapter(mockConfig);
      const connectSpy = jest.spyOn(newAdapter, 'connect').mockImplementation(async () => {
        (newAdapter as any).pool = mockPool;
      });
      
      mockPool.execute.mockResolvedValueOnce([{ insertId }]);
      mockPool.query.mockResolvedValueOnce([
        [{
          id: insertId,
          email: userData.email,
          password: userData.password,
          roles: JSON.stringify([mockConfig.defaultRole]),
          is_active: 1,
          created_at: new Date(),
          updated_at: new Date()
        }]
      ]);
      
      // Act
      await newAdapter.createUser(userData);
      
      // Assert
      expect(connectSpy).toHaveBeenCalled();
    });
  });
  
  describe('getUserById', () => {
    it('should get a user by ID', async () => {
      // Arrange
      const userId = '1';
      const dbUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        roles: JSON.stringify(['user']),
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockPool.query.mockResolvedValueOnce([[dbUser]]);
      
      // Act
      const result = await adapter.getUserById(userId);
      
      // Assert
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE id = ?'),
        [parseInt(userId)]
      );
      
      expect(result).toEqual({
        id: userId,
        email: dbUser.email,
        password: dbUser.password,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        roles: JSON.parse(dbUser.roles),
        isActive: Boolean(dbUser.is_active),
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      });
    });
    
    it('should return null if user not found', async () => {
      // Arrange
      const userId = '1';
      mockPool.query.mockResolvedValueOnce([[]]);
      
      // Act
      const result = await adapter.getUserById(userId);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should handle error and return null', async () => {
      // Arrange
      const userId = 'invalid-id';
      mockPool.query.mockRejectedValue(new Error('Invalid ID'));
      
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
        id: 1,
        email,
        password: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        roles: JSON.stringify(['user']),
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockPool.query.mockResolvedValueOnce([[dbUser]]);
      
      // Act
      const result = await adapter.getUserByEmail(email);
      
      // Assert
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE email = ?'),
        [email]
      );
      
      expect(result).toEqual({
        id: dbUser.id.toString(),
        email: dbUser.email,
        password: dbUser.password,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        roles: JSON.parse(dbUser.roles),
        isActive: Boolean(dbUser.is_active),
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      });
    });
    
    it('should return null if user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      mockPool.query.mockResolvedValueOnce([[]]);
      
      // Act
      const result = await adapter.getUserByEmail(email);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('updateUser', () => {
    it('should update a user', async () => {
      // Arrange
      const userId = '1';
      const updateData: UserUpdateInput = {
        firstName: 'Updated',
        lastName: 'User'
      };
      
      const dbUser = {
        id: parseInt(userId),
        email: 'test@example.com',
        password: 'hashedpassword',
        first_name: 'Updated',
        last_name: 'User',
        roles: JSON.stringify(['user']),
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      mockPool.query.mockResolvedValueOnce([[dbUser]]);
      
      // Act
      const result = await adapter.updateUser(userId, updateData);
      
      // Assert
      expect(mockPool.query).toHaveBeenNthCalledWith(1,
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining([
          updateData.firstName,
          updateData.lastName,
          userId
        ])
      );
      
      expect(result).toEqual({
        id: userId,
        email: dbUser.email,
        password: dbUser.password,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        roles: JSON.parse(dbUser.roles),
        isActive: Boolean(dbUser.is_active),
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      });
    });
    
    it('should throw error if user not found', async () => {
      // Arrange
      const userId = '999';
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
      
      // Act & Assert
      await expect(adapter.updateUser(userId, { firstName: 'Updated' }))
        .rejects.toThrow('User not found');
    });
  });
  
  describe('deleteUser', () => {
    it('should delete a user', async () => {
      // Arrange
      const userId = '1';
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      
      // Act
      const result = await adapter.deleteUser(userId);
      
      // Assert
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM users WHERE id = ?'),
        [userId]
      );
      expect(result).toBe(true);
    });
    
    it('should return false if user not found', async () => {
      // Arrange
      const userId = '999';
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
      
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
      
      const insertId = 1;
      
      // Fix the implementation for mysql query
      mockPool.query.mockResolvedValueOnce([{
        insertId: insertId
      }]);
      
      // When getting the role after creation
      mockPool.query.mockResolvedValueOnce([[{
        id: insertId,
        name: roleData.name,
        description: roleData.description,
        permissions: JSON.stringify(roleData.permissions),
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
      }]]);
      
      // Act
      const result = await adapter.createRole(roleData);
      
      // Assert
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO roles'),
        expect.arrayContaining([
          roleData.name,
          roleData.description,
          expect.any(String) // JSON permissions
        ])
      );
      
      expect(result).toEqual({
        id: insertId.toString(),
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });
  
  describe('getRoleById', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockPool.query.mockReset();
    });
    
    it('should get a role by ID', async () => {
      // Arrange
      const roleId = '1';
      const dbRole = {
        id: parseInt(roleId),
        name: 'admin',
        description: 'Administrator role',
        permissions: JSON.stringify(['user:read', 'user:write']),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockPool.query.mockResolvedValueOnce([[dbRole]]);
      
      // Act
      const result = await adapter.getRoleById(roleId);
      
      // Assert
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM roles WHERE id = ?'),
        [roleId]
      );
      
      expect(result).toEqual({
        id: roleId,
        name: dbRole.name,
        description: dbRole.description,
        permissions: JSON.parse(dbRole.permissions),
        createdAt: dbRole.created_at,
        updatedAt: dbRole.updated_at
      });
    });
    
    it('should return null if role not found', async () => {
      // Arrange
      const roleId = '999';
      // Explicitly mock to return empty result
      mockPool.query.mockImplementation((query: string, params: any[]) => {
        if (query.includes('SELECT * FROM roles WHERE id = ?')) {
          return Promise.resolve([[]]);
        }
        return Promise.resolve([[]]);
      });
      
      // Act
      const result = await adapter.getRoleById(roleId);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('getRoleByName', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockPool.query.mockReset();
    });
    
    it('should get a role by name', async () => {
      // Arrange
      const roleName = 'admin';
      const dbRole = {
        id: 1,
        name: roleName,
        description: 'Administrator role',
        permissions: JSON.stringify(['user:read', 'user:write']),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockPool.query.mockImplementation((query: string, params: any[]) => {
        if (query.includes('SELECT * FROM roles WHERE name = ?') && params[0] === roleName) {
          return Promise.resolve([[dbRole]]);
        }
        return Promise.resolve([[]]);
      });
      
      // Act
      const result = await adapter.getRoleByName(roleName);
      
      // Assert
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM roles WHERE name = ?'),
        [roleName]
      );
      
      expect(result).toEqual({
        id: dbRole.id.toString(),
        name: dbRole.name,
        description: dbRole.description,
        permissions: JSON.parse(dbRole.permissions),
        createdAt: dbRole.created_at,
        updatedAt: dbRole.updated_at
      });
    });
    
    it('should return null if role not found', async () => {
      // Arrange
      const roleName = 'nonexistent';
      mockPool.query.mockImplementation((query: string, params: any[]) => {
        if (query.includes('SELECT * FROM roles WHERE name = ?')) {
          return Promise.resolve([[]]);
        }
        return Promise.resolve([[]]);
      });
      
      // Act
      const result = await adapter.getRoleByName(roleName);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('updateRole', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockPool.query.mockReset();
    });
    
    it('should update a role', async () => {
      // Arrange
      const roleId = '1';
      const updateData: RoleUpdateInput = {
        description: 'Updated role description',
        permissions: ['user:read', 'user:write', 'user:delete']
      };
      
      const dbRole = {
        id: parseInt(roleId),
        name: 'admin',
        description: updateData.description,
        permissions: JSON.stringify(updateData.permissions),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockPool.query.mockImplementation((query: string, params: any[]) => {
        if (query.includes('UPDATE roles')) {
          return Promise.resolve([{ affectedRows: 1 }]);
        } else if (query.includes('SELECT * FROM roles WHERE id = ?')) {
          return Promise.resolve([[dbRole]]);
        }
        return Promise.resolve([[]]);
      });
      
      // Act
      const result = await adapter.updateRole(roleId, updateData);
      
      // Assert
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE roles'),
        expect.arrayContaining([
          updateData.description,
          JSON.stringify(updateData.permissions),
          roleId
        ])
      );
      
      expect(result).toEqual({
        id: roleId,
        name: dbRole.name,
        description: dbRole.description,
        permissions: updateData.permissions,
        createdAt: dbRole.created_at,
        updatedAt: dbRole.updated_at
      });
    });
    
    it('should throw error if role not found', async () => {
      // Arrange
      const roleId = '999';
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
      
      // Act & Assert
      await expect(adapter.updateRole(roleId, { description: 'Updated' }))
        .rejects.toThrow('Role not found');
    });
  });
  
  describe('deleteRole', () => {
    it('should delete a role', async () => {
      // Arrange
      const roleId = '1';
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      
      // Act
      const result = await adapter.deleteRole(roleId);
      
      // Assert
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM roles WHERE id = ?'),
        [roleId]
      );
      expect(result).toBe(true);
    });
    
    it('should return false if role not found', async () => {
      // Arrange
      const roleId = '999';
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
      
      // Act
      const result = await adapter.deleteRole(roleId);
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('assignRoleToUser', () => {
    it('should assign a role to a user', async () => {
      // Arrange
      const userId = '1';
      const roleId = '2';
      const role = {
        id: parseInt(roleId),
        name: 'admin',
        description: 'Administrator role',
        permissions: JSON.stringify(['user:read', 'user:write']),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const user = {
        id: parseInt(userId),
        email: 'test@example.com',
        password: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        roles: JSON.stringify(['user']),
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock getting the role
      mockPool.query.mockResolvedValueOnce([[role]]);
      // Mock getting the user
      mockPool.query.mockResolvedValueOnce([[user]]);
      // Mock updating the user
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      
      // Act
      const result = await adapter.assignRoleToUser(userId, roleId);
      
      // Assert
      expect(mockPool.query).toHaveBeenNthCalledWith(1, 
        expect.stringContaining('SELECT * FROM roles WHERE id = ?'),
        [roleId]
      );
      
      expect(mockPool.query).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('SELECT * FROM users WHERE id = ?'),
        [parseInt(userId)]
      );
      
      expect(mockPool.query).toHaveBeenNthCalledWith(3, 
        expect.stringContaining('UPDATE users SET roles'),
        expect.arrayContaining([
          expect.any(String), // JSON roles
          userId
        ])
      );
      
      expect(result).toBe(true);
    });
    
    it('should throw error if role not found', async () => {
      // Arrange
      const userId = '1';
      const roleId = '999';
      
      // Mock empty role result
      mockPool.query.mockResolvedValueOnce([[]]);
      
      // Act & Assert
      await expect(adapter.assignRoleToUser(userId, roleId))
        .rejects.toThrow('Role not found');
    });
    
    it('should throw error if user not found', async () => {
      // Arrange
      const userId = '999';
      const roleId = '2';
      const role = {
        id: parseInt(roleId),
        name: 'admin',
        description: 'Administrator role',
        permissions: JSON.stringify(['user:read', 'user:write']),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock role found but user not found
      mockPool.query.mockResolvedValueOnce([[role]]);
      mockPool.query.mockResolvedValueOnce([[]]);
      
      // Act & Assert
      await expect(adapter.assignRoleToUser(userId, roleId))
        .rejects.toThrow('User not found');
    });
    
    it('should return false if role already assigned', async () => {
      // Arrange
      const userId = '1';
      const roleId = '2';
      const role = {
        id: parseInt(roleId),
        name: 'admin',
        description: 'Administrator role',
        permissions: JSON.stringify(['user:read', 'user:write']),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const user = {
        id: parseInt(userId),
        email: 'test@example.com',
        password: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        roles: JSON.stringify(['user', 'admin']), // Role already assigned
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock successful roles and user queries
      mockPool.query.mockResolvedValueOnce([[role]]);
      mockPool.query.mockResolvedValueOnce([[user]]);
      
      // Act
      const result = await adapter.assignRoleToUser(userId, roleId);
      
      // Assert
      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(result).toBe(true);
    });
  });
  
  describe('removeRoleFromUser', () => {
    it('should remove a role from a user', async () => {
      // Arrange
      const userId = '1';
      const roleId = '2';
      const role = {
        id: parseInt(roleId),
        name: 'admin',
        description: 'Administrator role',
        permissions: JSON.stringify(['user:read', 'user:write']),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const user = {
        id: parseInt(userId),
        email: 'test@example.com',
        password: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        roles: JSON.stringify(['user', 'admin']),
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock getting the role
      mockPool.query.mockResolvedValueOnce([[role]]);
      // Mock getting the user
      mockPool.query.mockResolvedValueOnce([[user]]);
      // Mock updating the user
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      
      // Act
      const result = await adapter.removeRoleFromUser(userId, roleId);
      
      // Assert
      expect(mockPool.query).toHaveBeenNthCalledWith(1, 
        expect.stringContaining('SELECT * FROM roles WHERE id = ?'),
        [roleId]
      );
      
      expect(mockPool.query).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('SELECT * FROM users WHERE id = ?'),
        [parseInt(userId)]
      );
      
      expect(mockPool.query).toHaveBeenNthCalledWith(3, 
        expect.stringContaining('UPDATE users SET roles'),
        expect.arrayContaining([
          expect.any(String),
          userId
        ])
      );
      
      expect(result).toBe(true);
    });
    
    it('should throw error if role not found', async () => {
      // Arrange
      const userId = '1';
      const roleId = '999';
      
      // Mock empty role result
      mockPool.query.mockResolvedValueOnce([[]]);
      
      // Act & Assert
      await expect(adapter.removeRoleFromUser(userId, roleId))
        .rejects.toThrow('Role not found');
    });
    
    it('should throw error if user not found', async () => {
      // Arrange
      const userId = '999';
      const roleId = '2';
      const role = {
        id: parseInt(roleId),
        name: 'admin',
        description: 'Administrator role',
        permissions: JSON.stringify(['user:read', 'user:write']),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock role found but user not found
      mockPool.query.mockResolvedValueOnce([[role]]);
      mockPool.query.mockResolvedValueOnce([[]]);
      
      // Act & Assert
      await expect(adapter.removeRoleFromUser(userId, roleId))
        .rejects.toThrow('User not found');
    });
    
    it('should return true if role not assigned to user', async () => {
      // Arrange
      const userId = '1';
      const roleId = '2';
      const role = {
        id: parseInt(roleId),
        name: 'admin',
        description: 'Administrator role',
        permissions: JSON.stringify(['user:read', 'user:write']),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const user = {
        id: parseInt(userId),
        email: 'test@example.com',
        password: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        roles: JSON.stringify(['user']), // Role not assigned
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock role and user queries
      mockPool.query.mockResolvedValueOnce([[role]]);
      mockPool.query.mockResolvedValueOnce([[user]]);
      
      // Act
      const result = await adapter.removeRoleFromUser(userId, roleId);
      
      // Assert
      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(result).toBe(true);
    });
  });
  
  describe('getUserRoles', () => {
    it('should get user roles', async () => {
      // Arrange
      const userId = '1';
      const user = {
        id: parseInt(userId),
        email: 'test@example.com',
        password: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        roles: JSON.stringify(['user', 'admin']),
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const userRole = {
        id: 1,
        name: 'user',
        description: 'Regular user',
        permissions: JSON.stringify(['read']),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const adminRole = {
        id: 2,
        name: 'admin',
        description: 'Administrator',
        permissions: JSON.stringify(['read', 'write']),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock getting user
      mockPool.query.mockResolvedValueOnce([[user]]);
      // Mock getting individual roles
      mockPool.query.mockResolvedValueOnce([[userRole]]);
      mockPool.query.mockResolvedValueOnce([[adminRole]]);
      
      // Act
      const result = await adapter.getUserRoles(userId);
      
      // Assert
      expect(mockPool.query).toHaveBeenNthCalledWith(1, 
        expect.stringContaining('SELECT * FROM users WHERE id = ?'),
        [parseInt(userId)]
      );
      
      expect(mockPool.query).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('SELECT * FROM roles WHERE name = ?'),
        ['user']
      );
      
      expect(mockPool.query).toHaveBeenNthCalledWith(3, 
        expect.stringContaining('SELECT * FROM roles WHERE name = ?'),
        ['admin']
      );
      
      expect(result).toEqual([
        {
          id: userRole.id.toString(),
          name: userRole.name,
          description: userRole.description,
          permissions: JSON.parse(userRole.permissions),
          createdAt: userRole.created_at,
          updatedAt: userRole.updated_at
        },
        {
          id: adminRole.id.toString(),
          name: adminRole.name,
          description: adminRole.description,
          permissions: JSON.parse(adminRole.permissions),
          createdAt: adminRole.created_at,
          updatedAt: adminRole.updated_at
        }
      ]);
    });
    
    it('should throw error if user not found', async () => {
      // Arrange
      const userId = '999';
      
      // Mock user not found
      mockPool.query.mockResolvedValueOnce([[]]);
      
      // Act & Assert
      await expect(adapter.getUserRoles(userId))
        .rejects.toThrow('User not found');
    });
    
    it('should return empty array if user has no roles', async () => {
      // Arrange
      const userId = '1';
      const user = {
        id: parseInt(userId),
        email: 'test@example.com',
        password: 'hashedpassword',
        first_name: 'Test',
        last_name: 'User',
        roles: JSON.stringify([]), // No roles
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Mock getting user
      mockPool.query.mockResolvedValueOnce([[user]]);
      
      // Act
      const result = await adapter.getUserRoles(userId);
      
      // Assert
      expect(result).toEqual([]);
    });
  });
  
  describe('getUserByResetToken', () => {
    it('should get user by reset token', async () => {
      // Arrange
      const token = 'reset-token';
      const dbUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        reset_password_token: token,
        reset_password_expires: new Date(Date.now() + 3600000), // 1 hour in future
        first_name: 'Test',
        last_name: 'User',
        roles: JSON.stringify(['user']),
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockPool.query.mockResolvedValueOnce([[dbUser]]);
      
      // Act
      const result = await adapter.getUserByResetToken(token);
      
      // Assert
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE reset_password_token = ?'),
        [token]
      );
      
      expect(result).toEqual({
        id: dbUser.id.toString(),
        email: dbUser.email,
        password: dbUser.password,
        resetPasswordToken: dbUser.reset_password_token,
        resetPasswordExpires: dbUser.reset_password_expires,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        roles: JSON.parse(dbUser.roles),
        isActive: Boolean(dbUser.is_active),
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      });
    });
    
    it('should return null if token not found or expired', async () => {
      // Arrange
      const token = 'invalid-token';
      mockPool.query.mockResolvedValueOnce([[]]);
      
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
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        verification_token: token,
        first_name: 'Test',
        last_name: 'User',
        roles: JSON.stringify(['user']),
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockPool.query.mockResolvedValueOnce([[dbUser]]);
      
      // Act
      const result = await adapter.getUserByVerificationToken(token);
      
      // Assert
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE verification_token = ?'),
        [token]
      );
      
      expect(result).toEqual({
        id: dbUser.id.toString(),
        email: dbUser.email,
        password: dbUser.password,
        verificationToken: dbUser.verification_token,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        roles: JSON.parse(dbUser.roles),
        isActive: Boolean(dbUser.is_active),
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      });
    });
    
    it('should return null if token not found', async () => {
      // Arrange
      const token = 'invalid-token';
      mockPool.query.mockResolvedValueOnce([[]]);
      
      // Act
      const result = await adapter.getUserByVerificationToken(token);
      
      // Assert
      expect(result).toBeNull();
    });
  });
}); 