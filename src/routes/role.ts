import { Router } from 'express';
import { RoleController } from '../controllers';
import { RoleService } from '../services';
import { AuthXConfig } from '../config/types';
import { DbAdapter } from '../adapters/db';
import { AuthXMiddleware } from '../middleware';
import {
  createRoleValidation,
  updateRoleValidation,
  roleIdParamValidation,
  assignRoleValidation,
  userIdParamValidation
} from '../utils/validation';

/**
 * Setup role management routes
 * @param router Express router
 * @param config AuthX configuration
 * @param dbAdapter Database adapter
 */
export function setupRoleRoutes(router: Router, config: AuthXConfig, dbAdapter: DbAdapter): void {
  // Create services
  const roleService = new RoleService(config, dbAdapter);
  
  // Create controllers
  const roleController = new RoleController(roleService);
  
  // Create middleware
  const authMiddleware = new AuthXMiddleware(config, dbAdapter);
  
  // Register routes
  // Admin-only routes
  router.post('/role', 
    authMiddleware.authenticate({ throwError: true }), 
    authMiddleware.hasRole('admin', { throwError: true }),
    createRoleValidation, 
    roleController.createRole
  );
  
  router.get('/role/:id', 
    authMiddleware.authenticate({ throwError: true }), 
    authMiddleware.hasRole('admin', { throwError: true }),
    roleIdParamValidation, 
    roleController.getRoleById
  );
  
  router.put('/role/:id', 
    authMiddleware.authenticate({ throwError: true }), 
    authMiddleware.hasRole('admin', { throwError: true }),
    updateRoleValidation, 
    roleController.updateRole
  );
  
  router.delete('/role/:id', 
    authMiddleware.authenticate({ throwError: true }), 
    authMiddleware.hasRole('admin', { throwError: true }),
    roleIdParamValidation, 
    roleController.deleteRole
  );
  
  // User-role management
  router.post('/role/assign', 
    authMiddleware.authenticate({ throwError: true }), 
    authMiddleware.hasRole('admin', { throwError: true }),
    assignRoleValidation, 
    roleController.assignRoleToUser
  );
  
  router.post('/role/remove', 
    authMiddleware.authenticate({ throwError: true }), 
    authMiddleware.hasRole('admin', { throwError: true }),
    assignRoleValidation, 
    roleController.removeRoleFromUser
  );
  
  router.get('/user/:userId/roles', 
    authMiddleware.authenticate({ throwError: true }), 
    userIdParamValidation, 
    roleController.getUserRoles
  );
} 