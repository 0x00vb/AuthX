import { MongoDbAdapter } from '../../../../src/adapters/db/mongodb';
import { AuthXConfig } from '../../../../src/config/types';
import { defaultConfig } from '../../../../src/config/default';
import { User, UserCreateInput, UserUpdateInput, Role, RoleCreateInput, RoleUpdateInput } from '../../../../src/models';
import { Collection, MongoClient, ObjectId } from 'mongodb';

// Mock the MongoDB client
jest.mock('mongodb', () => {
  // Actual ObjectId functionality we want to preserve
  const originalModule = jest.requireActual('mongodb');
  
  const mockCollection = {
    createIndex: jest.fn().mockResolvedValue(null),
    insertOne: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    updateOne: jest.fn()
  };
  
  const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection)
  };
  
  const mockClient = {
    connect: jest.fn().mockResolvedValue(null),
    close: jest.fn().mockResolvedValue(null),
    db: jest.fn().mockReturnValue(mockDb)
  };
  
  return {
    MongoClient: jest.fn().mockImplementation(() => mockClient),
    ObjectId: originalModule.ObjectId
  };
});

// Console mocks to silence logs
console.log = jest.fn();
console.error = jest.fn();

describe('MongoDbAdapter', () => {
  let adapter: MongoDbAdapter;
  let mockConfig: AuthXConfig;
  let mockUsersCollection: any;
  let mockRolesCollection: any;
  let mockClient: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = { ...defaultConfig, dbUri: 'mongodb://localhost:27017/authx_test' };
    adapter = new MongoDbAdapter(mockConfig);
    
    // Access the mock directly from the jest.mock implementation
    mockClient = (MongoClient as unknown as jest.Mock)();
    mockUsersCollection = mockClient.db().collection("users");
    mockRolesCollection = mockClient.db().collection("roles");
    
    // Manually inject collections
    (adapter as any).client = mockClient;
    (adapter as any).usersCollection = mockUsersCollection;
    (adapter as any).rolesCollection = mockRolesCollection;
  });
  
  describe('connect', () => {
    it('should connect to MongoDB and create indexes', async () => {
      // Arrange
      mockClient.connect.mockClear();
      mockUsersCollection.createIndex.mockClear();
      mockRolesCollection.createIndex.mockClear();
      
      // Act
      await adapter.connect();
      
      // Assert
      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockClient.db).toHaveBeenCalled();
      expect(mockClient.db().collection).toHaveBeenCalledWith('users');
      expect(mockClient.db().collection).toHaveBeenCalledWith('roles');
      
      // Check indexes
      expect(mockUsersCollection.createIndex).toHaveBeenCalledWith({ email: 1 }, { unique: true });
      expect(mockUsersCollection.createIndex).toHaveBeenCalledWith({ resetPasswordToken: 1 }, { sparse: true });
      expect(mockUsersCollection.createIndex).toHaveBeenCalledWith({ verificationToken: 1 }, { sparse: true });
      expect(mockRolesCollection.createIndex).toHaveBeenCalledWith({ name: 1 }, { unique: true });
    });
    
    it('should handle connection errors', async () => {
      // Arrange
      const error = new Error('Connection failed');
      mockClient.connect.mockRejectedValue(error);
      
      // Act & Assert
      await expect(adapter.connect()).rejects.toThrow('Connection failed');
    });
  });
  
  describe('disconnect', () => {
    it('should disconnect from MongoDB', async () => {
      // Act
      await adapter.disconnect();
      
      // Assert
      expect(mockClient.close).toHaveBeenCalled();
      expect((adapter as any).client).toBeNull();
      expect((adapter as any).usersCollection).toBeNull();
      expect((adapter as any).rolesCollection).toBeNull();
    });
    
    it('should do nothing if not connected', async () => {
      // Arrange
      (adapter as any).client = null;
      
      // Act
      await adapter.disconnect();
      
      // Assert
      expect(mockClient.close).not.toHaveBeenCalled();
    });
  });
  
  describe('createUser', () => {
    it('should create a new user', async () => {
      // Arrange
      const now = new Date();
      const userData: UserCreateInput = {
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User'
      };
      
      const insertedId = new ObjectId();
      mockUsersCollection.insertOne.mockResolvedValue({ insertedId });
      
      // Act
      const result = await adapter.createUser(userData);
      
      // Assert
      expect(mockUsersCollection.insertOne).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roles: [mockConfig.defaultRole],
        isActive: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
      
      expect(result).toEqual({
        id: insertedId.toString(),
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
      
      const insertedId = new ObjectId();
      mockUsersCollection.insertOne.mockResolvedValue({ insertedId });
      
      // Create a new instance without initialized collections to test connect
      const newAdapter = new MongoDbAdapter(mockConfig);
      const connectSpy = jest.spyOn(newAdapter, 'connect').mockImplementation(async () => {
        (newAdapter as any).client = mockClient;
        (newAdapter as any).usersCollection = mockUsersCollection;
        (newAdapter as any).rolesCollection = mockRolesCollection;
      });
      
      // Act
      await newAdapter.createUser(userData);
      
      // Assert
      expect(connectSpy).toHaveBeenCalled();
    });
  });
  
  describe('getUserById', () => {
    it('should get a user by ID', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      const dbUser = {
        _id: new ObjectId(userId),
        email: 'test@example.com',
        password: 'hashedpassword',
        roles: ['user'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockUsersCollection.findOne.mockResolvedValue(dbUser);
      
      // Act
      const result = await adapter.getUserById(userId);
      
      // Assert
      expect(mockUsersCollection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(userId) });
      expect(result).toEqual({
        id: userId,
        email: dbUser.email,
        password: dbUser.password,
        roles: dbUser.roles,
        isActive: dbUser.isActive,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt
      });
    });
    
    it('should return null if user not found', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      mockUsersCollection.findOne.mockResolvedValue(null);
      
      // Act
      const result = await adapter.getUserById(userId);
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should handle error and return null', async () => {
      // Arrange
      const userId = 'invalid-id';
      mockUsersCollection.findOne.mockRejectedValue(new Error('Invalid ObjectId'));
      
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
        _id: new ObjectId(),
        email,
        password: 'hashedpassword',
        roles: ['user'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockUsersCollection.findOne.mockResolvedValue(dbUser);
      
      // Act
      const result = await adapter.getUserByEmail(email);
      
      // Assert
      expect(mockUsersCollection.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual({
        id: dbUser._id.toString(),
        email: dbUser.email,
        password: dbUser.password,
        roles: dbUser.roles,
        isActive: dbUser.isActive,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt
      });
    });
    
    it('should return null if user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      mockUsersCollection.findOne.mockResolvedValue(null);
      
      // Act
      const result = await adapter.getUserByEmail(email);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('updateUser', () => {
    it('should update a user', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      const updateData: UserUpdateInput = {
        firstName: 'Updated',
        lastName: 'User'
      };
      
      const dbUser = {
        _id: new ObjectId(userId),
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Updated',
        lastName: 'User',
        roles: ['user'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockUsersCollection.findOneAndUpdate.mockResolvedValue(dbUser);
      
      // Act
      const result = await adapter.updateUser(userId, updateData);
      
      // Assert
      expect(mockUsersCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(userId) },
        { $set: { ...updateData, updatedAt: expect.any(Date) } },
        { returnDocument: 'after' }
      );
      
      expect(result).toEqual({
        id: userId,
        email: dbUser.email,
        password: dbUser.password,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        roles: dbUser.roles,
        isActive: dbUser.isActive,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt
      });
    });
    
    it('should throw error if user not found', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      mockUsersCollection.findOneAndUpdate.mockResolvedValue(null);
      
      // Act & Assert
      await expect(adapter.updateUser(userId, { firstName: 'Updated' }))
        .rejects.toThrow('User not found');
    });
  });
  
  describe('deleteUser', () => {
    it('should delete a user', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      mockUsersCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
      
      // Act
      const result = await adapter.deleteUser(userId);
      
      // Assert
      expect(mockUsersCollection.deleteOne).toHaveBeenCalledWith({ _id: new ObjectId(userId) });
      expect(result).toBe(true);
    });
    
    it('should return false if user not found', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      mockUsersCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });
      
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
      
      const insertedId = new ObjectId();
      mockRolesCollection.insertOne.mockResolvedValue({ insertedId });
      
      // Act
      const result = await adapter.createRole(roleData);
      
      // Assert
      expect(mockRolesCollection.insertOne).toHaveBeenCalledWith({
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
      
      expect(result).toEqual({
        id: insertedId.toString(),
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });
  
  describe('getRoleById', () => {
    it('should get a role by ID', async () => {
      // Arrange
      const roleId = new ObjectId().toString();
      const dbRole = {
        _id: new ObjectId(roleId),
        name: 'admin',
        description: 'Administrator role',
        permissions: ['user:read', 'user:write'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockRolesCollection.findOne.mockResolvedValue(dbRole);
      
      // Act
      const result = await adapter.getRoleById(roleId);
      
      // Assert
      expect(mockRolesCollection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(roleId) });
      expect(result).toEqual({
        id: roleId,
        name: dbRole.name,
        description: dbRole.description,
        permissions: dbRole.permissions,
        createdAt: dbRole.createdAt,
        updatedAt: dbRole.updatedAt
      });
    });
    
    it('should return null if role not found', async () => {
      // Arrange
      const roleId = new ObjectId().toString();
      mockRolesCollection.findOne.mockResolvedValue(null);
      
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
        _id: new ObjectId(),
        name: roleName,
        description: 'Administrator role',
        permissions: ['user:read', 'user:write'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockRolesCollection.findOne.mockResolvedValue(dbRole);
      
      // Act
      const result = await adapter.getRoleByName(roleName);
      
      // Assert
      expect(mockRolesCollection.findOne).toHaveBeenCalledWith({ name: roleName });
      expect(result).toEqual({
        id: dbRole._id.toString(),
        name: dbRole.name,
        description: dbRole.description,
        permissions: dbRole.permissions,
        createdAt: dbRole.createdAt,
        updatedAt: dbRole.updatedAt
      });
    });
    
    it('should return null if role not found', async () => {
      // Arrange
      const roleName = 'nonexistent';
      mockRolesCollection.findOne.mockResolvedValue(null);
      
      // Act
      const result = await adapter.getRoleByName(roleName);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('updateRole', () => {
    it('should update a role', async () => {
      // Arrange
      const roleId = new ObjectId().toString();
      const updateData: RoleUpdateInput = {
        description: 'Updated role description',
        permissions: ['user:read', 'user:write', 'user:delete']
      };
      
      const dbRole = {
        _id: new ObjectId(roleId),
        name: 'admin',
        description: updateData.description,
        permissions: updateData.permissions,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockRolesCollection.findOneAndUpdate.mockResolvedValue(dbRole);
      
      // Act
      const result = await adapter.updateRole(roleId, updateData);
      
      // Assert
      expect(mockRolesCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(roleId) },
        { $set: { ...updateData, updatedAt: expect.any(Date) } },
        { returnDocument: 'after' }
      );
      
      expect(result).toEqual({
        id: roleId,
        name: dbRole.name,
        description: dbRole.description,
        permissions: dbRole.permissions,
        createdAt: dbRole.createdAt,
        updatedAt: dbRole.updatedAt
      });
    });
    
    it('should throw error if role not found', async () => {
      // Arrange
      const roleId = new ObjectId().toString();
      mockRolesCollection.findOneAndUpdate.mockResolvedValue(null);
      
      // Act & Assert
      await expect(adapter.updateRole(roleId, { description: 'Updated' }))
        .rejects.toThrow('Role not found');
    });
  });
  
  describe('deleteRole', () => {
    it('should delete a role', async () => {
      // Arrange
      const roleId = new ObjectId().toString();
      mockRolesCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
      
      // Act
      const result = await adapter.deleteRole(roleId);
      
      // Assert
      expect(mockRolesCollection.deleteOne).toHaveBeenCalledWith({ _id: new ObjectId(roleId) });
      expect(result).toBe(true);
    });
    
    it('should return false if role not found', async () => {
      // Arrange
      const roleId = new ObjectId().toString();
      mockRolesCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });
      
      // Act
      const result = await adapter.deleteRole(roleId);
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('assignRoleToUser', () => {
    it('should assign a role to a user', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      const roleId = new ObjectId().toString();
      const role = {
        id: roleId,
        name: 'admin',
        description: 'Administrator role',
        permissions: ['user:read', 'user:write'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockRolesCollection.findOne.mockImplementation(async (query: any) => {
        if (query._id.toString() === roleId) {
          return {
            _id: new ObjectId(roleId),
            name: role.name,
            description: role.description,
            permissions: role.permissions,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt
          };
        }
        return null;
      });
      
      mockUsersCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
      
      // Create spy to mock the getRoleById method
      jest.spyOn(adapter, 'getRoleById').mockResolvedValue(role);
      
      // Act
      const result = await adapter.assignRoleToUser(userId, roleId);
      
      // Assert
      expect(adapter.getRoleById).toHaveBeenCalledWith(roleId);
      expect(mockUsersCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(userId) },
        { $addToSet: { roles: role.name } }
      );
      expect(result).toBe(true);
    });
    
    it('should throw error if role not found', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      const roleId = new ObjectId().toString();
      
      jest.spyOn(adapter, 'getRoleById').mockResolvedValue(null);
      
      // Act & Assert
      await expect(adapter.assignRoleToUser(userId, roleId))
        .rejects.toThrow('Role not found');
    });
    
    it('should return false if user not found or role already assigned', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      const roleId = new ObjectId().toString();
      const role = {
        id: roleId,
        name: 'admin',
        description: 'Administrator role',
        permissions: ['user:read', 'user:write'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(adapter, 'getRoleById').mockResolvedValue(role);
      mockUsersCollection.updateOne.mockResolvedValue({ modifiedCount: 0 });
      
      // Act
      const result = await adapter.assignRoleToUser(userId, roleId);
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('removeRoleFromUser', () => {
    it('should remove a role from a user', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      const roleId = new ObjectId().toString();
      const role = {
        id: roleId,
        name: 'admin',
        description: 'Administrator role',
        permissions: ['user:read', 'user:write'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const user = {
        id: userId,
        email: 'test@example.com',
        password: 'hashedpassword',
        roles: ['user', 'admin'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(adapter, 'getRoleById').mockResolvedValue(role);
      jest.spyOn(adapter, 'getUserById').mockResolvedValue(user);
      
      mockUsersCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
      
      // Act
      const result = await adapter.removeRoleFromUser(userId, roleId);
      
      // Assert
      expect(adapter.getRoleById).toHaveBeenCalledWith(roleId);
      expect(adapter.getUserById).toHaveBeenCalledWith(userId);
      expect(mockUsersCollection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(userId) },
        { $set: { roles: ['user'] } }
      );
      expect(result).toBe(true);
    });
    
    it('should throw error if role not found', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      const roleId = new ObjectId().toString();
      
      jest.spyOn(adapter, 'getRoleById').mockResolvedValue(null);
      
      // Act & Assert
      await expect(adapter.removeRoleFromUser(userId, roleId))
        .rejects.toThrow('Role not found');
    });
    
    it('should throw error if user not found', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      const roleId = new ObjectId().toString();
      const role = {
        id: roleId,
        name: 'admin',
        description: 'Administrator role',
        permissions: ['user:read', 'user:write'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(adapter, 'getRoleById').mockResolvedValue(role);
      jest.spyOn(adapter, 'getUserById').mockResolvedValue(null);
      
      // Act & Assert
      await expect(adapter.removeRoleFromUser(userId, roleId))
        .rejects.toThrow('User not found');
    });
  });
  
  describe('getUserRoles', () => {
    it('should get user roles', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      const user = {
        id: userId,
        email: 'test@example.com',
        password: 'hashedpassword',
        roles: ['user', 'admin'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const userRole = {
        id: new ObjectId().toString(),
        name: 'user',
        description: 'User role',
        permissions: ['read'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const adminRole = {
        id: new ObjectId().toString(),
        name: 'admin',
        description: 'Administrator role',
        permissions: ['read', 'write'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(adapter, 'getUserById').mockResolvedValue(user);
      jest.spyOn(adapter, 'getRoleByName')
        .mockImplementation(async (name: string) => {
          if (name === 'user') return userRole;
          if (name === 'admin') return adminRole;
          return null;
        });
      
      // Act
      const result = await adapter.getUserRoles(userId);
      
      // Assert
      expect(adapter.getUserById).toHaveBeenCalledWith(userId);
      expect(adapter.getRoleByName).toHaveBeenCalledWith('user');
      expect(adapter.getRoleByName).toHaveBeenCalledWith('admin');
      expect(result).toEqual([userRole, adminRole]);
    });
    
    it('should throw error if user not found', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      
      jest.spyOn(adapter, 'getUserById').mockResolvedValue(null);
      
      // Act & Assert
      await expect(adapter.getUserRoles(userId))
        .rejects.toThrow('User not found');
    });
    
    it('should throw error if a role is not found', async () => {
      // Arrange
      const userId = new ObjectId().toString();
      const user = {
        id: userId,
        email: 'test@example.com',
        password: 'hashedpassword',
        roles: ['user', 'admin'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const userRole = {
        id: new ObjectId().toString(),
        name: 'user',
        description: 'User role',
        permissions: ['read'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      jest.spyOn(adapter, 'getUserById').mockResolvedValue(user);
      jest.spyOn(adapter, 'getRoleByName')
        .mockImplementation(async (name: string) => {
          if (name === 'user') return userRole;
          return null;
        });
      
      // Act & Assert
      await expect(adapter.getUserRoles(userId))
        .rejects.toThrow('Role not found: admin');
    });
  });
  
  describe('getUserByResetToken', () => {
    it('should get user by reset token', async () => {
      // Arrange
      const token = 'reset-token';
      const dbUser = {
        _id: new ObjectId(),
        email: 'test@example.com',
        password: 'hashedpassword',
        resetPasswordToken: token,
        resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour in future
        roles: ['user'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockUsersCollection.findOne.mockResolvedValue(dbUser);
      
      // Act
      const result = await adapter.getUserByResetToken(token);
      
      // Assert
      expect(mockUsersCollection.findOne).toHaveBeenCalledWith({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: expect.any(Date) }
      });
      
      expect(result).toEqual({
        id: dbUser._id.toString(),
        email: dbUser.email,
        password: dbUser.password,
        resetPasswordToken: dbUser.resetPasswordToken,
        resetPasswordExpires: dbUser.resetPasswordExpires,
        roles: dbUser.roles,
        isActive: dbUser.isActive,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt
      });
    });
    
    it('should return null if token not found or expired', async () => {
      // Arrange
      const token = 'invalid-token';
      mockUsersCollection.findOne.mockResolvedValue(null);
      
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
        _id: new ObjectId(),
        email: 'test@example.com',
        password: 'hashedpassword',
        verificationToken: token,
        roles: ['user'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockUsersCollection.findOne.mockResolvedValue(dbUser);
      
      // Act
      const result = await adapter.getUserByVerificationToken(token);
      
      // Assert
      expect(mockUsersCollection.findOne).toHaveBeenCalledWith({ verificationToken: token });
      
      expect(result).toEqual({
        id: dbUser._id.toString(),
        email: dbUser.email,
        password: dbUser.password,
        verificationToken: dbUser.verificationToken,
        roles: dbUser.roles,
        isActive: dbUser.isActive,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt
      });
    });
    
    it('should return null if token not found', async () => {
      // Arrange
      const token = 'invalid-token';
      mockUsersCollection.findOne.mockResolvedValue(null);
      
      // Act
      const result = await adapter.getUserByVerificationToken(token);
      
      // Assert
      expect(result).toBeNull();
    });
  });
}); 