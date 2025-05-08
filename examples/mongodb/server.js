/**
 * MongoDB Example for Express Auth Toolkit
 * 
 * This example demonstrates how to use the Express Auth Toolkit
 * with MongoDB as the database adapter.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { MongoClient } = require('mongodb');
const AuthX = require('../../src'); // In real usage: require('express-auth-toolkit')

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth_example';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

/**
 * Initialize the MongoDB connection and setup auth toolkit
 */
async function initApp() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('MongoDB connected successfully');
    
    // Initialize the MongoDB adapter
    const mongoAdapter = AuthX.adapters.mongo({
      client,
      dbName: 'auth_example',
      usersCollection: 'users',
      verificationTokensCollection: 'verification_tokens',
      passwordResetTokensCollection: 'password_reset_tokens'
    });
    
    // Initialize the auth toolkit with MongoDB adapter
    const authToolkit = new AuthX({
      jwtOptions: {
        secret: process.env.JWT_SECRET || 'mongodb-example-secret-change-in-production',
        accessExpiresIn: '15m',
        refreshExpiresIn: '7d'
      },
      emailOptions: {
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        transport: {
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587'),
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        }
      },
      adapter: mongoAdapter,
      useRefreshTokens: true,
      useSessionCookies: true,
      enable2FA: true,
      enableEmailVerification: true,
      enablePasswordReset: true,
      baseUrl: '/api/auth'
    });
    
    // Initialize the adapter
    await mongoAdapter.init();
    
    // Register auth routes
    authToolkit.init(app);
    
    // Get middleware references for securing routes
    const { requireAuth, requireRole, validate2FA } = authToolkit.getMiddlewares();
    
    // Public route
    app.get('/api/public', (req, res) => {
      res.json({ message: 'This is a public endpoint' });
    });
    
    // Protected route (requires authentication)
    app.get('/api/protected', requireAuth(), (req, res) => {
      res.json({ 
        message: 'This is a protected endpoint',
        user: req.user
      });
    });
    
    // Admin route (requires authentication + admin role)
    app.get('/api/admin', requireAuth(), requireRole('admin'), (req, res) => {
      res.json({ 
        message: 'This is an admin endpoint',
        user: req.user
      });
    });
    
    // 2FA-protected route (requires authentication + 2FA verification)
    app.get('/api/sensitive', requireAuth(), validate2FA(), (req, res) => {
      res.json({ 
        message: 'This is a sensitive endpoint protected by 2FA',
        user: req.user
      });
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Closing MongoDB connection');
      await client.close();
      process.exit(0);
    });
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`MongoDB connected at: ${MONGODB_URI}`);
      console.log(`Auth routes available at: http://localhost:${PORT}${authToolkit.config.baseUrl}`);
    });
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start the application
initApp(); 