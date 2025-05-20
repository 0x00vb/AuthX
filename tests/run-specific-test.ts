import { exec } from 'child_process';
import { setupPostgresTestDatabase, teardownPostgresTestDatabase } from './setup-postgres';

async function runTest(testFile: string): Promise<boolean> {
  console.log(`Running test: ${testFile}`);
  
  // Run the test
  const testProcess = exec(`npx jest ${testFile} --verbose --runInBand`);
  
  // Forward stdout and stderr
  testProcess.stdout?.pipe(process.stdout);
  testProcess.stderr?.pipe(process.stderr);
  
  // Wait for the test to complete
  const exitCode = await new Promise<number>((resolve) => {
    testProcess.on('exit', (code) => {
      resolve(code || 0);
    });
  });
  
  return exitCode === 0;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Please provide a test file to run');
    process.exit(1);
  }
  
  const testFile = args[0];
  
  try {
    // Setup the database
    console.log('Setting up PostgreSQL test database...');
    await setupPostgresTestDatabase();
    
    // Run the test
    const success = await runTest(testFile);
    
    if (success) {
      console.log(`✅ Test ${testFile} passed successfully!`);
    } else {
      console.error(`❌ Test ${testFile} failed!`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running test:', error);
    process.exit(1);
  } finally {
    // Cleanup the database
    try {
      console.log('Cleaning up PostgreSQL test database...');
      await teardownPostgresTestDatabase();
    } catch (err) {
      console.error('Error cleaning up PostgreSQL test database:', err);
    }
  }
}

// Run the main function
main(); 