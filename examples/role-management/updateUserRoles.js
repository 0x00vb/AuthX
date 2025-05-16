/**
 * AuthX Role Management Utility
 * 
 * This script allows you to add or remove roles from a user
 * 
 * Usage:
 *   node updateUserRoles.js add admin user@example.com
 *   node updateUserRoles.js remove admin user@example.com
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { roles } = require('../../src');

// Define args
const [action, roleName, userEmail] = process.argv.slice(2);

// Load User model
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  roles: {
    type: [String],
    default: ['user'],
  }
});

// Validate inputs
if (!action || !roleName || !userEmail) {
  console.error(`
Usage:
  node updateUserRoles.js add <role> <email>
  node updateUserRoles.js remove <role> <email>

Available roles: ${Object.values(roles.ROLES).join(', ')}
  `);
  process.exit(1);
}

if (!['add', 'remove'].includes(action)) {
  console.error(`Invalid action. Use 'add' or 'remove'`);
  process.exit(1);
}

if (!Object.values(roles.ROLES).includes(roleName)) {
  console.error(`Invalid role. Available roles: ${Object.values(roles.ROLES).join(', ')}`);
  console.error(`If you want to use a custom role, edit this script to allow custom roles.`);
  process.exit(1);
}

async function updateRole() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/authx');
    
    // Get User model
    const User = mongoose.model('User', userSchema);
    
    // Find user
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.error(`User with email ${userEmail} not found`);
      process.exit(1);
    }
    
    // Update roles
    if (action === 'add') {
      roles.addRole(user, roleName);
      await user.save();
      console.log(`✅ Added role '${roleName}' to user ${userEmail}`);
    } else {
      roles.removeRole(user, roleName);
      await user.save();
      console.log(`✅ Removed role '${roleName}' from user ${userEmail}`);
    }
    
    console.log(`User roles: ${user.roles.join(', ')}`);
    
    // Disconnect
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateRole(); 