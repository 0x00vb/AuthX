"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoleRoutes = setupRoleRoutes;
const controllers_1 = require("../controllers");
const services_1 = require("../services");
const middleware_1 = require("../middleware");
const validation_1 = require("../utils/validation");
/**
 * Setup role management routes
 * @param router Express router
 * @param config AuthX configuration
 * @param dbAdapter Database adapter
 */
function setupRoleRoutes(router, config, dbAdapter) {
    // Create services
    const roleService = new services_1.RoleService(config, dbAdapter);
    // Create controllers
    const roleController = new controllers_1.RoleController(roleService);
    // Create middleware
    const authMiddleware = new middleware_1.AuthXMiddleware(config, dbAdapter);
    // Register routes
    // Admin-only routes
    router.post('/role', authMiddleware.authenticate({ throwError: true }), authMiddleware.hasRole('admin', { throwError: true }), validation_1.createRoleValidation, roleController.createRole);
    router.get('/role/:id', authMiddleware.authenticate({ throwError: true }), authMiddleware.hasRole('admin', { throwError: true }), validation_1.roleIdParamValidation, roleController.getRoleById);
    router.put('/role/:id', authMiddleware.authenticate({ throwError: true }), authMiddleware.hasRole('admin', { throwError: true }), validation_1.updateRoleValidation, roleController.updateRole);
    router.delete('/role/:id', authMiddleware.authenticate({ throwError: true }), authMiddleware.hasRole('admin', { throwError: true }), validation_1.roleIdParamValidation, roleController.deleteRole);
    // User-role management
    router.post('/role/assign', authMiddleware.authenticate({ throwError: true }), authMiddleware.hasRole('admin', { throwError: true }), validation_1.assignRoleValidation, roleController.assignRoleToUser);
    router.post('/role/remove', authMiddleware.authenticate({ throwError: true }), authMiddleware.hasRole('admin', { throwError: true }), validation_1.assignRoleValidation, roleController.removeRoleFromUser);
    router.get('/user/:userId/roles', authMiddleware.authenticate({ throwError: true }), validation_1.userIdParamValidation, roleController.getUserRoles);
}
//# sourceMappingURL=role.js.map