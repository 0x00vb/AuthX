import { exec } from 'child_process';
import { setupPostgresTestDatabase, teardownPostgresTestDatabase } from './setup-postgres';

async function runTests() {
  console.log('Setting up PostgreSQL test database...');
  
  try {
    // Setup the PostgreSQL test database
    await setupPostgresTestDatabase();
    
    console.log('Running PostgreSQL auth tests...');
    
    // Run the auth tests first
    const authProcess = exec('npx jest tests/integration/postgres/auth.test.ts --verbose --runInBand');
    
    // Forward stdout and stderr to the console
    authProcess.stdout?.pipe(process.stdout);
    authProcess.stderr?.pipe(process.stderr);
    
    // Wait for the auth tests to complete
    const authResult = await new Promise<number>((resolve) => {
      authProcess.on('exit', (code) => {
        resolve(code || 0);
      });
    });
    
    console.log('Running PostgreSQL role tests...');
    
    // Run the role tests next
    const roleProcess = exec('npx jest tests/integration/postgres/role.test.ts --verbose --runInBand');
    
    // Forward stdout and stderr to the console
    roleProcess.stdout?.pipe(process.stdout);
    roleProcess.stderr?.pipe(process.stderr);
    
    // Wait for the role tests to complete
    const roleResult = await new Promise<number>((resolve) => {
      roleProcess.on('exit', (code) => {
        resolve(code || 0);
      });
    });
    
    // Check if all tests passed
    if (authResult === 0 && roleResult === 0) {
      console.log('All PostgreSQL tests passed successfully!');
    } else {
      console.error('Some PostgreSQL tests failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running PostgreSQL tests:', error);
    process.exit(1);
  } finally {
    try {
      // Clean up the PostgreSQL test database
      await teardownPostgresTestDatabase();
    } catch (err) {
      console.error('Error cleaning up PostgreSQL test database:', err);
    }
  }
}

// Run the tests
runTests(); 