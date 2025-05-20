import { AuthX } from '../../src';
import { DbAdapter } from '../../src/adapters/db/adapter';
import { Pool } from 'pg';
import { setupPostgresTestDatabase, teardownPostgresTestDatabase } from '../setup-postgres';
import request from 'supertest';

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DB_TYPE = 'postgres';
process.env.DB_URI = 'postgresql://postgres:Valentino@localhost:5432/authx_test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
process.env.REFRESH_TOKEN_SECRET = 'test_refresh_token_secret_for_testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

// Create a test configuration
export const testConfig = {
  port: 3000,
  nodeEnv: 'test',
  dbType: 'postgres' as const,
  dbUri: 'postgresql://postgres:Valentino@localhost:5432/authx_test',
  jwtSecret: 'test_jwt_secret_key_for_testing',
  jwtExpiresIn: '1h',
  refreshTokenSecret: 'test_refresh_token_secret_for_testing',
  refreshTokenExpiresIn: '7d',
  emailService: 'smtp',
  emailHost: 'smtp.example.com',
  emailPort: 587,
  emailUser: 'test@example.com',
  emailPassword: 'password123',
  emailFrom: 'noreply@authx.com',
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // limit each IP to 100 requests per windowMs
  roles: ['user', 'admin'],
  defaultRole: 'user'
};

// Create a test AuthX instance
export function createTestAuthX(): AuthX {
  return new AuthX(testConfig);
}

// Get the database adapter from AuthX
export function getAdapter(authX: AuthX): DbAdapter {
  // Access the middleware property to get the dbAdapter
  return (authX.middleware as any).dbAdapter;
}

// Helper function to create an admin user with proper roles
export async function createAdminUser(app: any): Promise<{ adminToken: string, adminId: string }> {
  // Register an admin user
  const adminResponse = await request(app)
    .post('/auth/register')
    .send({
      email: 'admin@example.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
    });
  
  const adminId = adminResponse.body.user.id;
  
  // Get the adapter from the AuthX instance
  const authX = (app as any).authX;
  const adapter = getAdapter(authX);
  
  // Update the user to have admin role
  await adapter.updateUser(adminId, {
    roles: ['user', 'admin']
  });
  
  // Login with the updated user to get a token with admin privileges
  const loginResponse = await request(app)
    .post('/auth/login')
    .send({
      email: 'admin@example.com',
      password: 'password123',
    });
  
  return {
    adminToken: loginResponse.body.token,
    adminId
  };
}

// Get user by email
export async function getUserByEmail(adapter: DbAdapter, email: string) {
  return adapter.getUserByEmail(email);
}

// Update user
export async function updateUser(adapter: DbAdapter, id: string, userData: any) {
  return adapter.updateUser(id, userData);
}

// Set up the PostgreSQL test database
export async function setupPostgresForTests() {
  await setupPostgresTestDatabase();
}

// Clean up the PostgreSQL test database
export async function cleanupPostgresForTests() {
  await teardownPostgresTestDatabase();
}

// Truncate all tables
export async function truncateAllTables() {
  const pool = new Pool({ connectionString: testConfig.dbUri });
  
  try {
    await pool.query(`
      TRUNCATE TABLE users CASCADE;
      TRUNCATE TABLE roles CASCADE;
    `);
    
    // Re-create default roles
    await pool.query(`
      INSERT INTO roles (name, description, permissions) 
      VALUES 
        ('user', 'Default user role', '{}'),
        ('admin', 'Administrator role', '{"admin:read", "admin:write", "admin:delete"}')
      ON CONFLICT (name) DO NOTHING
    `);
  } catch (error) {
    console.error('Error truncating tables:', error);
  } finally {
    await pool.end();
  }
} 