# AuthX Minimal Example

This example shows how to implement AuthX with minimal code. It demonstrates the simplicity of setting up authentication and role-based access control.

## Features

- Complete authentication system with one line of code
- Role-based access control (RBAC) with predefined roles
- Protected routes for authenticated users
- Role-specific routes 

## Running the Example

1. Copy `.env.example` to `.env` and update the values:
   ```
   cp .env.example .env
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Generate secrets for JWT tokens:
   ```
   node ../../src/cli/generateSecret.js
   ```
   Copy the generated secrets to your `.env` file.

4. Start the example server:
   ```
   node server.js
   ```

## Testing the API

Once the server is running, you can test with curl or a tool like Postman:

### 1. Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!","firstName":"John","lastName":"Doe"}'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}'
```
Save the returned access token.

### 3. Access Protected Routes
```bash
# Access protected route
curl -X GET http://localhost:3000/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Try to access admin route (will fail with default user role)
curl -X GET http://localhost:3000/admin \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Working with Roles

By default, new users are assigned the `user` role. To add the admin role:

1. In a real application, you would update a user's roles through a dedicated admin interface or API
2. For testing, you can modify the register function in AuthService to assign specific roles during registration

## Available Roles

AuthX provides predefined roles:
- `user` - Basic user with standard permissions
- `admin` - Administrator with full system access
- `moderator` - Moderator with elevated permissions
- `guest` - Limited access for unauthenticated users 