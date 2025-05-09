# Express Auth Toolkit
![image](https://github.com/user-attachments/assets/a535e585-4e59-4b99-ae14-e5625bef67c9)

[![npm version](https://img.shields.io/npm/v/express-auth-toolkit.svg)](https://www.npmjs.com/package/express-auth-toolkit)
[![License](https://img.shields.io/npm/l/express-auth-toolkit.svg)](https://github.com/yourusername/express-auth-toolkit/blob/main/LICENSE)

A comprehensive, production-ready authentication system for Express.js applications.

## Features

### Core Authentication
- User registration and login
- JWT-based authentication (access & refresh tokens)
- Password hashing with bcrypt
- Email verification
- Password reset workflow
- Role-based access control
- Token blacklisting
- Rate limiting

### Advanced Features
- Two-factor authentication (TOTP)
- OAuth integration (Google, GitHub)
- Multiple database adapters (Memory, MongoDB, SQL/Sequelize)
- Session cookies support
- Recovery codes for 2FA

### Architecture
- Modular design with separate services, middlewares, routes, and utilities
- Database-agnostic through adapter pattern
- Configurable options with sensible defaults
- Clean API for integration

### Developer Tools
- CLI utility for generating secrets, hashing passwords, etc.
- Example implementation
- Environment variable templates

## Installation

```bash
npm install express-auth-toolkit
```

## Quick Start

```javascript
const express = require('express');
const { AuthX } = require('express-auth-toolkit');

const app = express();
app.use(express.json());

// Initialize auth toolkit with default memory adapter
const authToolkit = new AuthX({
  jwtOptions: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d'
  }
});

// Register auth routes at /auth
authToolkit.init(app);

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Configuration Options

```javascript
const authToolkit = new AuthX({
  // JWT configuration
  jwtOptions: {
    secret: 'your-secret-key',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d'
  },
  
  // Email configuration (for verification, password reset)
  emailOptions: {
    from: 'noreply@example.com',
    transport: {
      host: 'smtp.example.com',
      port: 587,
      auth: {
        user: 'username',
        pass: 'password'
      }
    }
  },
  
  // Rate limiting options
  rateLimitOptions: {
    loginWindow: 15 * 60 * 1000, // 15 minutes
    loginMax: 5, // 5 attempts
    passwordResetWindow: 60 * 60 * 1000, // 1 hour
    passwordResetMax: 3 // 3 attempts
  },
  
  // Database adapter (memory, mongo, sql)
  adapter: require('express-auth-toolkit').adapters.mongo({
    uri: 'mongodb://localhost:27017/myapp'
  }),
  
  // Feature flags
  useRefreshTokens: true,
  useSessionCookies: false,
  enable2FA: true,
  
  // Base URL for auth routes
  baseUrl: '/auth'
});
```

## Database Adapters

### Memory Adapter (for development)

```javascript
const { adapters } = require('express-auth-toolkit');
const memoryAdapter = adapters.memory();
```

### MongoDB Adapter

```javascript
const { adapters } = require('express-auth-toolkit');
const mongoAdapter = adapters.mongo({
  uri: 'mongodb://localhost:27017/myapp',
  userCollection: 'users',
  tokenCollection: 'tokens'
});
```

### SQL Adapter (using Sequelize)

```javascript
const { adapters } = require('express-auth-toolkit');
const sqlAdapter = adapters.sql({
  dialect: 'postgres',
  host: 'localhost',
  username: 'postgres',
  password: 'password',
  database: 'myapp'
});
```

## Authentication Routes

The toolkit provides the following routes under the base URL (default: `/auth`):

### User Management
- `POST /register` - Register a new user
- `POST /login` - Authenticate a user
- `POST /refresh-token` - Get a new access token using a refresh token
- `POST /logout` - Logout (blacklist the token)
- `GET /verify-email/:token` - Verify email address
- `POST /forgot-password` - Request password reset
- `POST /reset-password/:token` - Reset password with token

### Two-Factor Authentication
- `POST /2fa/setup` - Set up 2FA
- `POST /2fa/verify` - Verify 2FA code
- `POST /2fa/disable` - Disable 2FA
- `GET /2fa/recovery-codes` - Get recovery codes
- `POST /2fa/recovery-codes` - Use a recovery code

### OAuth
- `GET /oauth/google` - Initiate Google OAuth flow
- `GET /oauth/google/callback` - Google OAuth callback
- `GET /oauth/github` - Initiate GitHub OAuth flow
- `GET /oauth/github/callback` - GitHub OAuth callback

## Middleware Usage

```javascript
const { middlewares } = require('express-auth-toolkit');

// Protect routes
app.get('/protected', 
  middlewares.requireAuth(), 
  (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
  }
);

// Role-based access control
app.get('/admin', 
  middlewares.requireAuth(),
  middlewares.requireRole('admin'),
  (req, res) => {
    res.json({ message: 'Admin panel', user: req.user });
  }
);

// Require 2FA
app.get('/sensitive', 
  middlewares.requireAuth(),
  middlewares.validate2FA(),
  (req, res) => {
    res.json({ message: 'Sensitive data', user: req.user });
  }
);
```

## CLI Tools

The toolkit includes a CLI utility for common tasks:

```bash
# Generate a secure random JWT secret
npx express-auth-toolkit generate:secret

# Hash a password for manual user creation
npx express-auth-toolkit hash:password mypassword

# Create a template .env file
npx express-auth-toolkit init:env
```

## Examples

See the `/examples` directory for complete example applications:

- `basic` - Simple authentication with memory adapter
- `mongodb` - MongoDB adapter with email verification
- `oauth` - OAuth integration with Google and GitHub
- `2fa` - Two-factor authentication example

## Security Best Practices

This toolkit implements multiple security best practices:

- JWT tokens with limited lifetime and refresh token rotation
- Password hashing with bcrypt and proper salt rounds
- Rate limiting for sensitive routes
- Token blacklisting for logout
- Email verification workflow
- Secure password reset flow
- Two-factor authentication
- Recovery codes for 2FA

## License

MIT 
