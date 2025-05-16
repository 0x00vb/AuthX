/**
 * Simplified API for AuthX
 */
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const AuthX = require('./authx');
const { MongooseAdapter } = require('../adapters');
const createRouter = require('../routes');
const services = require('../services');
const middlewares = require('../middlewares');
const roles = require('../utils/roles');

/**
 * Quick setup for AuthX with Express
 * 
 * @param {Object} options Configuration options
 * @returns {Object} Express app with AuthX configured
 */
const setup = (options = {}) => {
  // Create Express app if not provided
  const app = options.app || express();
  
  // Apply common middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(cors(options.corsOptions || {}));
  
  // Create database adapter
  const dbAdapter = options.dbAdapter || new MongooseAdapter({
    uri: options.mongoUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/authx'
  });
  
  // Create AuthX instance
  const authX = new AuthX({
    dbAdapter,
    accessTokenSecret: options.accessTokenSecret || process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: options.refreshTokenSecret || process.env.REFRESH_TOKEN_SECRET,
    useEmailVerification: options.useEmailVerification || process.env.USE_EMAIL_VERIFICATION === 'true',
    useCookies: options.useCookies || process.env.USE_COOKIES === 'true',
    use2FA: options.use2FA || process.env.USE_2FA === 'true',
  });
  
  // Initialize services
  const authService = new services.AuthService({
    dbAdapter,
    config: authX,
    tokenService: new services.TokenService({ dbAdapter }),
    emailService: new services.EmailService({ config: authX }),
  });
  
  const userService = new services.UserService({
    dbAdapter,
  });
  
  const twoFactorService = new services.TwoFactorService({
    dbAdapter,
    config: authX,
  });
  
  const servicesBundle = {
    AuthService: authService,
    UserService: userService,
    TwoFactorService: twoFactorService,
  };
  
  // Initialize AuthX
  authX.init(app);
  
  // Mount routes if requested
  if (options.mountRoutes !== false) {
    const routePrefix = options.routePrefix || '/api';
    app.use(routePrefix, createRouter(authX, servicesBundle));
  }
  
  return {
    app,
    authX,
    services: servicesBundle,
    middlewares,
    roles,
    protect: middlewares.auth.verifyToken(authX),
    requireRole: (role) => [
      middlewares.auth.verifyToken(authX),
      middlewares.auth.hasRole(role)
    ],
    requireRoles: (roles) => [
      middlewares.auth.verifyToken(authX),
      middlewares.auth.hasRole(roles)
    ]
  };
};

module.exports = { setup }; 