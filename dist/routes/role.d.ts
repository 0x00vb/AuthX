import { Router } from 'express';
import { AuthXConfig } from '../config/types';
import { DbAdapter } from '../adapters/db';
/**
 * Setup role management routes
 * @param router Express router
 * @param config AuthX configuration
 * @param dbAdapter Database adapter
 */
export declare function setupRoleRoutes(router: Router, config: AuthXConfig, dbAdapter: DbAdapter): void;
