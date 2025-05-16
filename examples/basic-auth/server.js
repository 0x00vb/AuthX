/**
 * Basic AuthX Example
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { AuthX, middlewares, services } = require('../../src');
const { MongooseAdapter } = require('../../src/adapters');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

// Create database adapter
const dbAdapter = new MongooseAdapter({
  uri: 'mongodb://mongo:27017/authx',
});

// Create AuthX instance
const authX = new AuthX({
  dbAdapter,
  accessTokenSecret: "supersecret123",
  refreshTokenSecret: "refreshsecret456",
  useEmailVerification: false,
  useCookies: true,
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

// Initialize AuthX and mount routes
const createRouter = require('../../src/routes');
app.use('/api', createRouter(authX, servicesBundle));

// Protected route example
app.get('/api/protected', 
  middlewares.auth.verifyToken(authX),
  (req, res) => {
    res.json({
      message: 'This is a protected route',
      user: req.user,
    });
  }
);

// Admin route example
app.get('/api/admin',
  middlewares.auth.verifyToken(authX),
  middlewares.auth.hasRole('admin'),
  (req, res) => {
    res.json({
      message: 'This is an admin route',
      user: req.user,
    });
  }
);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'AuthX API Running',
    documentation: '/api/docs',
  });
});

// Error handlers
app.use(middlewares.error.notFound);
app.use(middlewares.error.errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});