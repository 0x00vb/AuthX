import { Request, Response } from 'express';
import { RoleService } from '../services';
/**
 * Role controller
 * Handles HTTP requests for role operations
 */
export declare class RoleController {
    private roleService;
    constructor(roleService: RoleService);
    /**
     * Create a new role
     */
    createRole: (req: Request, res: Response) => Promise<void>;
    /**
     * Get role by ID
     */
    getRoleById: (req: Request, res: Response) => Promise<void>;
    /**
     * Update role
     */
    updateRole: (req: Request, res: Response) => Promise<void>;
    /**
     * Delete role
     */
    deleteRole: (req: Request, res: Response) => Promise<void>;
    /**
     * Assign role to user
     */
    assignRoleToUser: (req: Request, res: Response) => Promise<void>;
    /**
     * Remove role from user
     */
    removeRoleFromUser: (req: Request, res: Response) => Promise<void>;
    /**
     * Get user roles
     */
    getUserRoles: (req: Request, res: Response) => Promise<void>;
}
