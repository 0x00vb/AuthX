import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AuthXConfig } from '../config/types';
import { DbAdapter } from '../adapters/db';
import { setupAuthRoutes } from './auth';
import { setupRoleRoutes } from './role';

/**
 * Set up all routes for the application
 * @param router Express router
 * @param config AuthX configuration
 * @param dbAdapter Database adapter
 */
export function setupRoutes(router: Router, config: AuthXConfig, dbAdapter: DbAdapter): void {
  // Apply rate limiting to all routes
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  router.use(limiter);
  
  // Set up authentication routes
  setupAuthRoutes(router, config, dbAdapter);
  
  // Set up role routes
  setupRoleRoutes(router, config, dbAdapter);
  
  // Add more route setups here
} 