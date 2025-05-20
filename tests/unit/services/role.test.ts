import { RoleService } from '../../../src/services';
import { defaultConfig } from '../../../src/config/default';
import { DbAdapter } from '../../../src/adapters/db/adapter';
import { Role, RoleCreateInput, RoleUpdateInput } from '../../../src/models';

// Mock implementation of DbAdapter
const mockDbAdapter: Partial<DbAdapter> = {
  getRoleByName: jest.fn(),
  createRole: jest.fn(),
  getRoleById: jest.fn(),
  updateRole: jest.fn(),
  deleteRole: jest.fn(),
  assignRoleToUser: jest.fn(),
  removeRoleFromUser: jest.fn(),
  getUserRoles: jest.fn(),
};

describe('RoleService', () => {
  let roleService: RoleService;
  const mockConfig = { ...defaultConfig };
  
  beforeEach(() => {
    jest.clearAllMocks();
    roleService = new RoleService(mockConfig, mockDbAdapter as DbAdapter);
  });
  
  describe('createRole', () => {
    it('should create a new role', async () => {
      // Arrange
      const roleData: RoleCreateInput = {
        name: 'admin',
        description: 'Administrator role',
        permissions: ['user:read', 'user:write']
      };
      
      const mockRole: Role = {
        id: '123',
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (mockDbAdapter.getRoleByName as jest.Mock).mockResolvedValue(null);
      (mockDbAdapter.createRole as jest.Mock).mockResolvedValue(mockRole);
      
      // Act
      const result = await roleService.createRole(roleData);
      
      // Assert
      expect(mockDbAdapter.getRoleByName).toHaveBeenCalledWith(roleData.name);
      expect(mockDbAdapter.createRole).toHaveBeenCalledWith(roleData);
      expect(result).toEqual(mockRole);
    });
    
    it('should throw an error if role already exists', async () => {
      // Arrange
      const roleData: RoleCreateInput = {
        name: 'existing',
        description: 'Existing role',
      };
      
      const existingRole: Role = {
        id: '123',
        name: roleData.name,
        description: roleData.description,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (mockDbAdapter.getRoleByName as jest.Mock).mockResolvedValue(existingRole);
      
      // Act & Assert
      await expect(roleService.createRole(roleData)).rejects.toThrow('Role already exists');
      expect(mockDbAdapter.getRoleByName).toHaveBeenCalledWith(roleData.name);
      expect(mockDbAdapter.createRole).not.toHaveBeenCalled();
    });
  });
  
  describe('getRoleById', () => {
    it('should get a role by id', async () => {
      // Arrange
      const roleId = '123';
      const mockRole: Role = {
        id: roleId,
        name: 'admin',
        description: 'Administrator role',
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (mockDbAdapter.getRoleById as jest.Mock).mockResolvedValue(mockRole);
      
      // Act
      const result = await roleService.getRoleById(roleId);
      
      // Assert
      expect(mockDbAdapter.getRoleById).toHaveBeenCalledWith(roleId);
      expect(result).toEqual(mockRole);
    });
    
    it('should throw an error if role not found', async () => {
      // Arrange
      const roleId = '999';
      
      (mockDbAdapter.getRoleById as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(roleService.getRoleById(roleId)).rejects.toThrow('Role not found');
      expect(mockDbAdapter.getRoleById).toHaveBeenCalledWith(roleId);
    });
  });
  
  describe('updateRole', () => {
    it('should update a role', async () => {
      // Arrange
      const roleId = '123';
      const updateData: RoleUpdateInput = {
        description: 'Updated description',
        permissions: ['user:read', 'user:write', 'user:delete']
      };
      
      const existingRole: Role = {
        id: roleId,
        name: 'admin',
        description: 'Administrator role',
        permissions: ['user:read', 'user:write'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updatedRole: Role = {
        ...existingRole,
        ...updateData,
        updatedAt: new Date(),
      };
      
      (mockDbAdapter.getRoleById as jest.Mock).mockResolvedValue(existingRole);
      (mockDbAdapter.updateRole as jest.Mock).mockResolvedValue(updatedRole);
      
      // Act
      const result = await roleService.updateRole(roleId, updateData);
      
      // Assert
      expect(mockDbAdapter.getRoleById).toHaveBeenCalledWith(roleId);
      expect(mockDbAdapter.updateRole).toHaveBeenCalledWith(roleId, updateData);
      expect(result).toEqual(updatedRole);
    });
    
    it('should throw an error if role not found', async () => {
      // Arrange
      const roleId = '999';
      const updateData: RoleUpdateInput = {
        description: 'Updated description',
      };
      
      (mockDbAdapter.getRoleById as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(roleService.updateRole(roleId, updateData)).rejects.toThrow('Role not found');
      expect(mockDbAdapter.getRoleById).toHaveBeenCalledWith(roleId);
      expect(mockDbAdapter.updateRole).not.toHaveBeenCalled();
    });
    
    it('should throw an error if updating to a name that already exists', async () => {
      // Arrange
      const roleId = '123';
      const updateData: RoleUpdateInput = {
        name: 'admin2',
      };
      
      const existingRole: Role = {
        id: roleId,
        name: 'admin',
        description: 'Administrator role',
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const conflictingRole: Role = {
        id: '456',
        name: 'admin2',
        description: 'Another role',
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (mockDbAdapter.getRoleById as jest.Mock).mockResolvedValue(existingRole);
      (mockDbAdapter.getRoleByName as jest.Mock).mockResolvedValue(conflictingRole);
      
      // Act & Assert
      await expect(roleService.updateRole(roleId, updateData)).rejects.toThrow('Role name already in use');
      expect(mockDbAdapter.getRoleById).toHaveBeenCalledWith(roleId);
      expect(mockDbAdapter.getRoleByName).toHaveBeenCalledWith(updateData.name);
      expect(mockDbAdapter.updateRole).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteRole', () => {
    it('should delete a role', async () => {
      // Arrange
      const roleId = '123';
      const mockRole: Role = {
        id: roleId,
        name: 'admin',
        description: 'Administrator role',
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      (mockDbAdapter.getRoleById as jest.Mock).mockResolvedValue(mockRole);
      (mockDbAdapter.deleteRole as jest.Mock).mockResolvedValue(true);
      
      // Act
      const result = await roleService.deleteRole(roleId);
      
      // Assert
      expect(mockDbAdapter.getRoleById).toHaveBeenCalledWith(roleId);
      expect(mockDbAdapter.deleteRole).toHaveBeenCalledWith(roleId);
      expect(result).toBe(true);
    });
    
    it('should throw an error if role not found', async () => {
      // Arrange
      const roleId = '999';
      
      (mockDbAdapter.getRoleById as jest.Mock).mockResolvedValue(null);
      
      // Act & Assert
      await expect(roleService.deleteRole(roleId)).rejects.toThrow('Role not found');
      expect(mockDbAdapter.getRoleById).toHaveBeenCalledWith(roleId);
      expect(mockDbAdapter.deleteRole).not.toHaveBeenCalled();
    });
  });
}); 