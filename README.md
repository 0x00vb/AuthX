# AuthX

AuthX is a flexible authentication package with role-based access control for JavaScript and TypeScript projects.

## Features

- 🔐 Complete authentication flows: register, login, password reset
- 🛡️ Role-based access control with customizable permissions
- 🌐 Multiple database support (MongoDB, PostgreSQL, MySQL)
- 📦 TypeScript and JavaScript compatibility
- 🧩 Extensible architecture with modular design
- 🔍 Comprehensive test suite with Jest

## Installation

```bash
npm install authx
```

## Quick Start

```typescript
import { AuthX } from 'authx';
import express from 'express';

const app = express();
app.use(express.json());

// Initialize AuthX with your configuration
const authX = new AuthX({
  dbType: 'mongodb',
  dbUri: 'mongodb://localhost:27017/myapp',
  jwtSecret: 'your-jwt-secret',
  refreshTokenSecret: 'your-refresh-token-secret'
});

// Register AuthX routes
app.use('/api/auth', authX.getRouter());

// Use AuthX middleware for protected routes
app.get('/api/protected', 
  authX.middleware.authenticate(),
  authX.middleware.hasRole('admin'),
  (req, res) => {
    res.json({ message: 'Admin access granted' });
  }
);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Configuration

AuthX can be configured using environment variables or by passing options directly:

```typescript
const authX = new AuthX({
  dbType: 'postgres', // 'mongodb', 'postgres', or 'mysql'
  dbUri: 'postgresql://postgres:password@localhost:5432/myapp',
  jwtSecret: 'your-jwt-secret',
  jwtExpiresIn: '1h',
  refreshTokenSecret: 'your-refresh-token-secret',
  refreshTokenExpiresIn: '7d',
  roles: ['user', 'admin', 'editor'], // Default roles
  defaultRole: 'user'
});
```

See [sample.env](./sample.env) for all available configuration options.

## Testing

### Running Tests

To run the complete test suite:

```bash
npm test
```

### PostgreSQL Tests

To run tests with a PostgreSQL database:

1. Ensure PostgreSQL is installed and running on your machine
2. Set the PostgreSQL connection details in the test files or use the defaults (postgres:Valentino@localhost:5432)

Run individual PostgreSQL test suites:

```bash
# Run authentication tests
npm run test:postgres:auth

# Run role management tests
npm run test:postgres:role

# Run all PostgreSQL tests sequentially
npm run test:postgres:all
```

## Documentation

### Auth Routes

- `POST /register`: Register a new user
- `POST /login`: Authenticate user and receive JWT token
- `POST /forgot-password`: Send password reset token to user's email
- `POST /reset-password`: Reset password using a valid token
- `POST /refresh-token`: Get a new JWT using a refresh token
- `GET /me`: Get current user profile

### Role Management Routes

- `POST /role`: Create a new role (admin only)
- `GET /role/:id`: Get role by ID (admin only)
- `PUT /role/:id`: Update an existing role (admin only)
- `DELETE /role/:id`: Delete a role (admin only)
- `POST /role/assign`: Assign a role to a user (admin only)
- `POST /role/remove`: Remove a role from a user (admin only)
- `GET /user/:userId/roles`: Get all roles for a user

### Middleware

AuthX provides middleware for protecting routes:

```typescript
// Authenticate users
app.use(authX.middleware.authenticate());

// Check for roles
app.use(authX.middleware.hasRole('admin'));

// Optional authentication (no error thrown)
app.use(authX.middleware.authenticate({ throwError: false }));
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License. 