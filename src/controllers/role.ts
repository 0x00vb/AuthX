import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { RoleService } from '../services';

/**
 * Role controller
 * Handles HTTP requests for role operations
 */
export class RoleController {
  private roleService: RoleService;
  
  constructor(roleService: RoleService) {
    this.roleService = roleService;
  }
  
  /**
   * Create a new role
   */
  public createRole = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const { name, description, permissions } = req.body;
      
      // Create role
      const role = await this.roleService.createRole({
        name,
        description,
        permissions,
      });
      
      res.status(201).json(role);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      
      if (message === 'Role already exists') {
        res.status(400).json({ message });
      } else {
        res.status(500).json({ message });
      }
    }
  };
  
  /**
   * Get role by ID
   */
  public getRoleById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const role = await this.roleService.getRoleById(id);
      
      res.status(200).json(role);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      
      if (message === 'Role not found') {
        res.status(404).json({ message });
      } else {
        res.status(500).json({ message });
      }
    }
  };
  
  /**
   * Update role
   */
  public updateRole = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const { id } = req.params;
      const { name, description, permissions } = req.body;
      
      // Update role
      const role = await this.roleService.updateRole(id, {
        name,
        description,
        permissions,
      });
      
      res.status(200).json(role);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      
      if (message === 'Role not found') {
        res.status(404).json({ message });
      } else if (message === 'Role name already in use') {
        res.status(400).json({ message });
      } else {
        res.status(500).json({ message });
      }
    }
  };
  
  /**
   * Delete role
   */
  public deleteRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const success = await this.roleService.deleteRole(id);
      
      if (success) {
        res.status(200).json({ message: 'Role deleted successfully' });
      } else {
        res.status(500).json({ message: 'Failed to delete role' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      
      if (message === 'Role not found') {
        res.status(404).json({ message });
      } else {
        res.status(500).json({ message });
      }
    }
  };
  
  /**
   * Assign role to user
   */
  public assignRoleToUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, roleId } = req.body;
      
      const success = await this.roleService.assignRoleToUser(userId, roleId);
      
      if (success) {
        res.status(200).json({ message: 'Role assigned successfully' });
      } else {
        res.status(500).json({ message: 'Failed to assign role' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message });
    }
  };
  
  /**
   * Remove role from user
   */
  public removeRoleFromUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, roleId } = req.body;
      
      const success = await this.roleService.removeRoleFromUser(userId, roleId);
      
      if (success) {
        res.status(200).json({ message: 'Role removed successfully' });
      } else {
        res.status(500).json({ message: 'Failed to remove role' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      res.status(500).json({ message });
    }
  };
  
  /**
   * Get user roles
   */
  public getUserRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      const roles = await this.roleService.getUserRoles(userId);
      
      res.status(200).json(roles);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      
      if (message.includes('User not found')) {
        res.status(404).json({ message: 'User not found' });
      } else if (message.includes('Role not found')) {
        res.status(500).json({ message: 'One or more roles not found' });
      } else {
        res.status(500).json({ message });
      }
    }
  };
} 