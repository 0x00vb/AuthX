#!/usr/bin/env node

/**
 * Express Auth Toolkit CLI
 * 
 * A command-line utility for common authentication tasks:
 * - Generate secure secrets
 * - Hash passwords
 * - Create environment variable templates
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { promisify } = require('util');

const writeFileAsync = promisify(fs.writeFile);

// Main CLI function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }
  
  const command = args[0];
  
  switch (command) {
    case 'generate:secret':
      await generateSecret(args.slice(1));
      break;
    case 'hash:password':
      await hashPassword(args.slice(1));
      break;
    case 'init:env':
      await initEnv(args.slice(1));
      break;
    case 'help':
      printHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

/**
 * Print CLI help information
 */
function printHelp() {
  console.log(`
EXPRESS AUTH TOOLKIT CLI

Available commands:

  generate:secret [length]       Generate a secure random secret
                                 [length] - Optional length (default: 64)
                                 
  hash:password <password> [rounds]
                                 Hash a password using bcrypt
                                 <password> - The password to hash
                                 [rounds] - Optional bcrypt rounds (default: 10)
                                 
  init:env [filename]            Create a template .env file
                                 [filename] - Optional filename (default: .env.example)
                                 
  help                           Show this help information
`);
}

/**
 * Generate a secure random secret
 * @param {string[]} args - Command arguments
 */
async function generateSecret(args) {
  try {
    const length = args[0] ? parseInt(args[0], 10) : 64;
    
    if (isNaN(length) || length <= 0) {
      console.error('Error: Length must be a positive number');
      process.exit(1);
    }
    
    const secret = crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
    
    console.log(`\nGenerated Secret (${length} characters):\n`);
    console.log(secret);
    console.log('\nStore this securely in your environment variables as JWT_SECRET');
  } catch (error) {
    console.error('Error generating secret:', error.message);
    process.exit(1);
  }
}

/**
 * Hash a password using bcrypt
 * @param {string[]} args - Command arguments
 */
async function hashPassword(args) {
  try {
    if (!args[0]) {
      console.error('Error: Password is required');
      console.log('Usage: npx express-auth-toolkit hash:password <password> [rounds]');
      process.exit(1);
    }
    
    const password = args[0];
    const rounds = args[1] ? parseInt(args[1], 10) : 10;
    
    if (isNaN(rounds) || rounds <= 0) {
      console.error('Error: Rounds must be a positive number');
      process.exit(1);
    }
    
    console.log(`Hashing password with ${rounds} rounds...`);
    const hash = await bcrypt.hash(password, rounds);
    
    console.log('\nPassword Hash:\n');
    console.log(hash);
    console.log('\nThis is the hash you would store in your database');
  } catch (error) {
    console.error('Error hashing password:', error.message);
    process.exit(1);
  }
}

/**
 * Create a template .env file
 * @param {string[]} args - Command arguments
 */
async function initEnv(args) {
  try {
    const filename = args[0] || '.env.example';
    const filePath = path.resolve(process.cwd(), filename);
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.error(`Error: File ${filename} already exists`);
      console.log('Use a different filename or delete the existing file');
      process.exit(1);
    }
    
    // Generate a random JWT secret
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    
    const envTemplate = `# Express Auth Toolkit Configuration
# Copy this file to .env and fill in your values

# JWT Configuration
JWT_SECRET=${jwtSecret}

# Email Configuration
EMAIL_FROM=noreply@example.com
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
EMAIL_SECURE=false  # true for 465, false for other ports

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/oauth/google/callback

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/oauth/github/callback

# App Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
APP_NAME=YourAppName

# URLs (for email templates)
EMAIL_VERIFICATION_URL=http://localhost:3000/auth/verify-email
PASSWORD_RESET_URL=http://localhost:3000/auth/reset-password
`;
    
    await writeFileAsync(filePath, envTemplate);
    console.log(`Template .env file created at: ${filePath}`);
    console.log('Copy this to .env and update with your actual configuration');
  } catch (error) {
    console.error('Error creating .env template:', error.message);
    process.exit(1);
  }
}

// Execute main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 