# AuthX

A simple yet powerful authentication system for Express.js applications.

## Core Features

- User registration and login
- JWT auth with access & refresh tokens
- Password hashing with bcrypt
- Email verification
- Role-based access control (RBAC)

## Quick Start

### 1. Install

```bash
npm install authx
```

### 2. Create your app with one line

```javascript
const { quickSetup, roles } = require('authx');

// Initialize with one line
const { app, protect, requireRole } = quickSetup();

// Protect routes with simple middleware
app.get('/protected', protect, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Add role-based protection
app.get('/admin', requireRole(roles.ROLES.ADMIN), (req, res) => {
  res.json({ message: 'Admin only route' });
});

// Start server
app.listen(3000);
```

## Role Management

AuthX provides simple role management out of the box:

```javascript
const { roles } = require('authx');

// Available default roles
console.log(roles.ROLES);
// { USER: 'user', ADMIN: 'admin', MODERATOR: 'moderator', GUEST: 'guest' }

// Check if a user has a role
if (roles.hasRole(user, roles.ROLES.ADMIN)) {
  // User is an admin
}

// Check for multiple roles
if (roles.hasAnyRole(user, [roles.ROLES.ADMIN, roles.ROLES.MODERATOR])) {
  // User is either admin or moderator
}

// Add a role to a user
const updatedUser = roles.addRole(user, roles.ROLES.MODERATOR);

// Remove a role
const userWithoutAdmin = roles.removeRole(user, roles.ROLES.ADMIN);
```

## Protecting Routes

Protect routes with simple middleware:

```javascript
const { quickSetup, roles } = require('authx');
const { app, protect, requireRole } = quickSetup();

// Public route - no auth needed
app.get('/public', (req, res) => {
  res.json({ message: 'Public content' });
});

// Protected route - any authenticated user
app.get('/protected', protect, (req, res) => {
  res.json({ message: 'Protected content' });
});

// Role-based routes
app.get('/admin', requireRole(roles.ROLES.ADMIN), (req, res) => {
  res.json({ message: 'Admin content' });
});

// Multiple roles - user must have ANY of these roles
app.get('/staff', requireRole([roles.ROLES.ADMIN, roles.ROLES.MODERATOR]), (req, res) => {
  res.json({ message: 'Staff content' });
});
```

## Available Endpoints

AuthX automatically sets up the following API endpoints:

```
POST /api/auth/register          - Register new user
POST /api/auth/login             - Login
POST /api/auth/logout            - Logout
POST /api/auth/refresh-token     - Get new access token
GET  /api/auth/verify-email      - Verify email
POST /api/auth/forgot-password   - Request password reset
POST /api/auth/reset-password    - Reset password

GET  /api/users/me               - Get current user
PUT  /api/users/me               - Update profile
PUT  /api/users/me/password      - Change password
```

## Configuration

You can customize AuthX with options:

```javascript
const { quickSetup } = require('authx');

const { app } = quickSetup({
  // Database connection
  mongoUri: 'mongodb://localhost:27017/myapp',
  
  // JWT settings
  accessTokenSecret: 'your-access-token-secret',
  refreshTokenSecret: 'your-refresh-token-secret',
  
  // Features
  useEmailVerification: true,
  useCookies: true,
  use2FA: false,
  
  // API routes
  routePrefix: '/api',
  mountRoutes: true,
});
```

## Advanced Usage

Need more control? Use the full API:

```javascript
const express = require('express');
const { AuthX, MongooseAdapter, middlewares } = require('authx');

const app = express();
app.use(express.json());

// Create database adapter
const dbAdapter = new MongooseAdapter({
  uri: 'mongodb://localhost:27017/myapp'
});

// Create AuthX instance with custom options
const authX = new AuthX({
  dbAdapter,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
});

// Initialize
authX.init(app);

// Add routes
app.use('/api/auth', authX.createRouter(authX, authX.services));

// Start server
app.listen(3000);
```

## Documentation

For full documentation and examples, see the [examples](./examples) directory.

## License

MIT 