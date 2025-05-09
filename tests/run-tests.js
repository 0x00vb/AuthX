/**
 * AuthX Test Runner
 * 
 * This script runs all the authentication framework tests.
 */

const { spawn } = require('child_process');
const path = require('path');

// Define test files
const testFiles = [
  'auth.test.js',
  'user.test.js',
  '2fa.test.js'
];

// Run tests sequentially
async function runTests() {
  console.log('🔐 Running AuthX Authentication Framework Tests');
  console.log('==============================================');
  
  for (const testFile of testFiles) {
    const testPath = path.join(__dirname, testFile);
    console.log(`\n📋 Running test suite: ${testFile}`);
    
    try {
      await new Promise((resolve, reject) => {
        // Use Jest to run the test
        const testProcess = spawn('npx', ['jest', testPath, '--verbose'], {
          stdio: 'inherit'
        });
        
        testProcess.on('close', (code) => {
          if (code === 0) {
            console.log(`✅ ${testFile} passed`);
            resolve();
          } else {
            console.error(`❌ ${testFile} failed with code ${code}`);
            reject(new Error(`Test failed with code ${code}`));
          }
        });
        
        testProcess.on('error', (err) => {
          console.error(`❌ Error running ${testFile}:`, err);
          reject(err);
        });
      });
    } catch (error) {
      console.error(`Failed running ${testFile}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('\n✨ All tests completed');
}

// Run the tests
runTests(); 