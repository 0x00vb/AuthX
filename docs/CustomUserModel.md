# Customizing the User Model in AuthX

AuthX provides a flexible and type-safe way to extend the default User model with custom fields. This guide explains how to customize the User model to fit your application's needs.

## Overview

The AuthX custom user model system allows you to:

- Add application-specific fields to users
- Define role-specific fields
- Validate custom fields
- Maintain type safety throughout your application

## Basic Usage

### 1. Define Your Custom Fields Interface

First, define a TypeScript interface for your custom fields:

```typescript
interface MyCustomUserFields {
  avatar?: string;
  bio?: string;
  preferences?: {
    theme: string;
    notifications: boolean;
  };
}
```

### 2. Create an AuthX Instance with Your Custom Fields

When initializing AuthX, pass your custom fields interface as a generic type parameter:

```typescript
import { AuthX } from 'authx';

const authX = new AuthX<MyCustomUserFields>({
  // Your regular config options here
});
```

### 3. Configure Custom Fields

Define the structure and rules for your custom fields:

```typescript
import { UserExtensionHelper } from 'authx/utils/userModelExtension';

authX.extendUserModel({
  fields: [
    UserExtensionHelper.field('avatar', 'string'),
    UserExtensionHelper.field('bio', 'string'), 
    UserExtensionHelper.field('preferences', 'object', {
      defaultValue: {
        theme: 'light',
        notifications: true
      }
    })
  ]
});
```

### 4. Use Custom Fields

When creating or updating users, you can now include your custom fields:

```typescript
const userService = authX.getUserService();

// Create a user with custom fields
const user = await userService.createUser({
  email: 'user@example.com',
  password: 'securepassword',
  custom: {
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Software developer',
    preferences: {
      theme: 'dark',
      notifications: false
    }
  }
});

// Update custom fields
await userService.updateUser(user.id, {
  custom: {
    bio: 'Senior software developer'
  }
});
```

## Role-Based Custom Fields

You can assign fields to specific roles, ensuring they only apply to users with those roles:

```typescript
authX.extendUserModel({
  fields: [
    // Common fields for everyone
    UserExtensionHelper.field('avatar', 'string'),
    
    // Admin-only fields
    UserExtensionHelper.field('adminNotes', 'string', {
      roles: ['admin']
    }),
    
    // Customer-only fields
    UserExtensionHelper.field('customerRating', 'number', {
      roles: ['customer'],
      defaultValue: 5
    })
  ]
});
```

When creating users with role-specific fields:

```typescript
// For an admin user
const admin = await userService.createUser({
  email: 'admin@example.com',
  password: 'securepassword',
  roles: ['admin'],
  custom: {
    avatar: 'https://example.com/admin.jpg',
    adminNotes: 'Super admin account'
  }
});

// For a customer user
const customer = await userService.createUser({
  email: 'customer@example.com',
  password: 'securepassword',
  roles: ['customer'],
  custom: {
    avatar: 'https://example.com/customer.jpg',
    customerRating: 4.5
  }
});
```

## Field Types and Validation

AuthX supports various field types and validation:

```typescript
authX.extendUserModel({
  fields: [
    // String field
    UserExtensionHelper.field('nickname', 'string'),
    
    // Number field
    UserExtensionHelper.field('age', 'number'),
    
    // Boolean field
    UserExtensionHelper.field('emailVerified', 'boolean', {
      defaultValue: false
    }),
    
    // Date field
    UserExtensionHelper.field('birthday', 'date'),
    
    // Object field
    UserExtensionHelper.field('address', 'object'),
    
    // Array field
    UserExtensionHelper.field('favoriteColors', 'array', {
      defaultValue: ['blue', 'green']
    }),
    
    // Required field
    UserExtensionHelper.field('termsAccepted', 'boolean', {
      required: true
    })
  ]
});
```

## Helper Utilities

AuthX provides several utilities in the `UserExtensionHelper` class to work with custom fields:

### Get Role-Specific Fields

Extract only the fields relevant for a specific role:

```typescript
const userFields = UserExtensionHelper.getRoleFields(
  user, 
  'customer', 
  authX.getConfig()
);
```

### Validate Custom Fields

Validate custom fields against the configuration:

```typescript
const validation = UserExtensionHelper.validateCustomFields(
  customData,
  ['admin', 'user'],
  authX.getConfig()
);

if (!validation.valid) {
  console.error(validation.errors);
}
```

### Create Empty Fields Object with Defaults

Create an empty custom fields object with default values:

```typescript
const defaultFields = UserExtensionHelper.createEmptyCustomFields<MyCustomUserFields>(
  authX.getConfig(),
  ['customer']
);
```

## Database Storage

Custom fields are stored in a `custom` object in the database, keeping them separate from the core user fields. Each database adapter handles the storage and retrieval of custom fields automatically.

## Performance Considerations

- Custom fields are stored as a single JSON object in the database
- For complex queries on custom fields, consider creating database indexes for frequently queried fields
- For extremely large custom objects, consider storing large data in separate tables/collections

## Complete Example

See the `examples/customUserModel.ts` file for a complete example of using custom user fields with different roles. 