import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables from .env file
dotenv.config();

const DB_URI = process.env.DB_URI || 'postgresql://postgres:Valentino@localhost:5432/authx_test';

// Function to create the test database and schemas
export async function setupPostgresTestDatabase() {
  // Connect to default database to create our test database
  const defaultPool = new Pool({
    connectionString: DB_URI.replace('/authx_test', '/postgres')
  });

  try {
    // Create the test database (ignore error if already exists)
    try {
      await defaultPool.query('CREATE DATABASE authx_test');
      console.log('Created authx_test database');
    } catch (error: any) {
      if (error.code !== '42P04') { // Code for "database already exists"
        console.error('Error creating database:', error);
        throw error;
      }
      console.log('Test database already exists');
    }

    // Connect to the test database
    const testPool = new Pool({ connectionString: DB_URI });

    try {
      // Drop existing tables
      await testPool.query(`
        DROP TABLE IF EXISTS users CASCADE;
        DROP TABLE IF EXISTS roles CASCADE;
      `);
      
      // Create users table
      await testPool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          roles TEXT[] NOT NULL DEFAULT '{"user"}',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          verification_token VARCHAR(255),
          reset_password_token VARCHAR(255),
          reset_password_expires TIMESTAMP,
          last_login TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      // Create roles table
      await testPool.query(`
        CREATE TABLE roles (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          permissions TEXT[] NOT NULL DEFAULT '{}',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      // Create indexes
      await testPool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      await testPool.query('CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_password_token)');
      await testPool.query('CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token)');
      await testPool.query('CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name)');

      // Create default roles if they don't exist
      const defaultRoles = ['user', 'admin'];
      for (const role of defaultRoles) {
        await testPool.query(
          'INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [role]
        );
      }

      console.log('Database setup complete');
    } catch (error: any) {
      // Special handling for duplicate table errors
      if (error.code === '23505' && error.constraint === 'pg_class_relname_nsp_index') {
        console.log('Tables already exist, skipping creation');
      } else {
        console.error('Error setting up tables:', error);
        throw error;
      }
    } finally {
      // Close connection
      await testPool.end();
    }
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  } finally {
    await defaultPool.end();
  }
}

// Function to tear down test database
export async function teardownPostgresTestDatabase() {
  const pool = new Pool({ connectionString: DB_URI });
  
  try {
    // Clean up tables but don't drop the database itself
    await pool.query(`
      TRUNCATE TABLE users CASCADE;
      TRUNCATE TABLE roles CASCADE;
    `);
    
    // Re-add default roles
    const defaultRoles = ['user', 'admin'];
    for (const role of defaultRoles) {
      await pool.query(
        'INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [role]
      );
    }
    
    console.log('Database cleanup complete');
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  } finally {
    await pool.end();
  }
}

// If this script is run directly, set up the database
if (require.main === module) {
  setupPostgresTestDatabase()
    .then(() => {
      console.log('PostgreSQL test database setup completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('PostgreSQL test database setup failed:', error);
      process.exit(1);
    });
} 