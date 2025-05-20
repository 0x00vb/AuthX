"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const express_rate_limit_1 = require("express-rate-limit");
const auth_1 = require("./auth");
const role_1 = require("./role");
/**
 * Set up all routes for the application
 * @param router Express router
 * @param config AuthX configuration
 * @param dbAdapter Database adapter
 */
function setupRoutes(router, config, dbAdapter) {
    // Apply rate limiting to all routes
    const limiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: config.rateLimitWindowMs,
        max: config.rateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
    });
    router.use(limiter);
    // Set up authentication routes
    (0, auth_1.setupAuthRoutes)(router, config, dbAdapter);
    // Set up role routes
    (0, role_1.setupRoleRoutes)(router, config, dbAdapter);
    // Add more route setups here
}
//# sourceMappingURL=index.js.map