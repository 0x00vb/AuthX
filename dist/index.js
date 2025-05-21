"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthX = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const default_1 = require("./config/default");
const routes_1 = require("./routes");
const middleware_1 = require("./middleware");
const db_1 = require("./adapters/db");
const services_1 = require("./services");
// Load environment variables
dotenv_1.default.config();
class AuthX {
    constructor(userConfig = {}) {
        // Merge default config with user provided config
        this.config = {
            ...default_1.defaultConfig,
            ...userConfig,
        };
        // Initialize express app
        this.app = (0, express_1.default)();
        this.app.use(express_1.default.json());
        // Initialize database adapter
        const dbAdapter = (0, db_1.getDbAdapter)(this.config);
        // Initialize services
        this.authService = new services_1.AuthService(this.config, dbAdapter);
        this.roleService = new services_1.RoleService(this.config, dbAdapter);
        this.userService = new services_1.UserService(this.config, dbAdapter);
        // Initialize router
        this.router = express_1.default.Router();
        (0, routes_1.setupRoutes)(this.router, this.config, dbAdapter);
        // Initialize middleware
        this.middleware = new middleware_1.AuthXMiddleware(this.config, dbAdapter);
    }
    /**
     * Get the Express router with all authentication routes
     */
    getRouter() {
        return this.router;
    }
    /**
     * Get the Express app instance
     */
    getApp() {
        return this.app;
    }
    /**
     * Get the current configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Get auth service for customization
     */
    getAuthService() {
        return this.authService;
    }
    /**
     * Get role service for customization
     */
    getRoleService() {
        return this.roleService;
    }
    /**
     * Get user service for customization
     */
    getUserService() {
        return this.userService;
    }
}
exports.AuthX = AuthX;
// Export types
__exportStar(require("./config/types"), exports);
__exportStar(require("./models"), exports);
__exportStar(require("./middleware/types"), exports);
__exportStar(require("./services"), exports);
// Export default for compatibility
exports.default = AuthX;
//# sourceMappingURL=index.js.map