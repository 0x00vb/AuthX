import { Router } from 'express';
import { AuthXConfig } from '../config/types';
import { DbAdapter } from '../adapters/db';
/**
 * Set up all routes for the application
 * @param router Express router
 * @param config AuthX configuration
 * @param dbAdapter Database adapter
 */
export declare function setupRoutes(router: Router, config: AuthXConfig, dbAdapter: DbAdapter): void;
