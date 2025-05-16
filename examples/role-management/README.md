# AuthX Role Management Utility

This utility provides a simple way to manage user roles in your AuthX application.

## Features

- Add roles to existing users
- Remove roles from users
- Uses the built-in role helpers from AuthX

## Usage

1. Create a `.env` file with your MongoDB connection:
   ```
   MONGODB_URI=mongodb://localhost:27017/authx
   ```

2. Use the utility to add or remove roles:

   ```bash
   # Add admin role to a user
   node updateUserRoles.js add admin user@example.com
   
   # Remove admin role from a user
   node updateUserRoles.js remove admin user@example.com
   ```

## Available Roles

The utility supports the following built-in roles:

- `user` - Standard user permissions
- `admin` - Administrator with full permissions
- `moderator` - Moderator with elevated permissions
- `guest` - Limited permissions

## Customizing Roles

To add custom roles, you can:

1. Modify the updateUserRoles.js script to allow custom role names
2. Use the role utilities directly in your application:

```javascript
const { roles } = require('authx');

// Define custom roles
const CUSTOM_ROLES = {
  ...roles.ROLES,
  MANAGER: 'manager',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

// Use the roles in your application
const updatedUser = roles.addRole(user, CUSTOM_ROLES.MANAGER);
```

## Application Integration

You can use this utility as a starting point for building your own role management UI or API endpoints. The key functions used here are part of the public API:

- `roles.addRole(user, roleName)` - Add a role to a user
- `roles.removeRole(user, roleName)` - Remove a role from a user
- `roles.hasRole(user, roleName)` - Check if a user has a specific role
- `roles.hasAnyRole(user, roleNames)` - Check if a user has any of the specified roles 