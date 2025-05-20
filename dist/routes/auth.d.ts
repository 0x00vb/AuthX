import { Router } from 'express';
import { AuthXConfig } from '../config/types';
import { DbAdapter } from '../adapters/db';
/**
 * Setup authentication routes
 * @param router Express router
 * @param config AuthX configuration
 * @param dbAdapter Database adapter
 */
export declare function setupAuthRoutes(router: Router, config: AuthXConfig, dbAdapter: DbAdapter): void;
