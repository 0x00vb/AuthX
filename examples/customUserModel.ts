import { AuthX } from '../src';
import { UserExtensionHelper } from '../src/utils/userModelExtension';

// Define custom user fields interface
interface MyCustomUserFields {
  // Common fields for all users
  avatar?: string;
  bio?: string;
  
  // Admin-specific fields
  adminNotes?: string;
  
  // Customer-specific fields
  preferences?: {
    newsletter: boolean;
    darkMode: boolean;
  };
  
  // Employee-specific fields
  employeeId?: string;
  department?: string;
}

// Create AuthX instance with typed custom fields
const authX = new AuthX<MyCustomUserFields>({
  // Your regular config options here
});

// Define custom fields configuration
authX.extendUserModel({
  fields: [
    // Fields for all users
    UserExtensionHelper.field('avatar', 'string'),
    UserExtensionHelper.field('bio', 'string'),
    
    // Admin-specific fields
    UserExtensionHelper.field('adminNotes', 'string', {
      roles: ['admin']
    }),
    
    // Customer-specific fields
    UserExtensionHelper.field('preferences', 'object', {
      roles: ['customer'],
      defaultValue: {
        newsletter: true,
        darkMode: false
      }
    }),
    
    // Employee-specific fields
    UserExtensionHelper.field('employeeId', 'string', {
      roles: ['employee'],
      required: true
    }),
    UserExtensionHelper.field('department', 'string', {
      roles: ['employee']
    })
  ]
});

// Get user service with proper typing
const userService = authX.getUserService();

// Example: Create a new user with custom fields
async function createEmployee() {
  const newEmployee = await userService.createUser({
    email: 'employee@example.com',
    password: 'securepassword',
    firstName: 'Jane',
    lastName: 'Employee',
    roles: ['employee'],
    custom: {
      avatar: 'https://example.com/avatars/jane.jpg',
      bio: 'Senior Developer',
      employeeId: 'EMP-12345',
      department: 'Engineering'
    }
  });
  
  console.log('Created employee:', newEmployee);
  return newEmployee;
}

// Example: Update user with custom fields
async function updateUserPreferences(userId: string, darkMode: boolean) {
  const updatedUser = await userService.updateUser(userId, {
    custom: {
      preferences: {
        newsletter: true,
        darkMode
      }
    }
  });
  
  console.log('Updated user preferences:', updatedUser.custom?.preferences);
  return updatedUser;
}

// Example: Get role-specific fields
async function getUserProfileData(userId: string) {
  const user = await userService.getUserById(userId);
  if (!user) return null;
  
  // For a standard user, get only common fields
  if (user.roles.includes('customer')) {
    // Get only customer-specific fields
    const customerFields = UserExtensionHelper.getRoleFields(user, 'customer', authX.getConfig());
    
    return {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      preferences: customerFields.preferences
    };
  }
  
  // For an employee, include department info
  if (user.roles.includes('employee')) {
    const employeeFields = UserExtensionHelper.getRoleFields(user, 'employee', authX.getConfig());
    
    return {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      employeeId: employeeFields.employeeId,
      department: employeeFields.department
    };
  }
  
  // Default profile data
  return {
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    bio: user.custom?.bio
  };
}

// Example usage
export async function runExample() {
  // Create a user
  const employee = await createEmployee();
  
  // Update preferences
  const customer = await userService.createUser({
    email: 'customer@example.com',
    password: 'securepassword',
    roles: ['customer'],
    custom: {} // Default values will be applied
  });
  
  await updateUserPreferences(customer.id, true);
  
  // Get profile data
  const employeeProfile = await getUserProfileData(employee.id);
  console.log('Employee profile:', employeeProfile);
  
  const customerProfile = await getUserProfileData(customer.id);
  console.log('Customer profile:', customerProfile);
} 